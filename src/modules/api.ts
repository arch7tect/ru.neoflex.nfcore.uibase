import {Ecore} from "ecore";

export class Error {
    error: string = "Unknown error";
    message?: string;
    path?: string;
    status?: number;
    timestamp?: string;
    trace?: string;
    cause?: any;

    static fromResponce(response: Response): Error {
        return new Error({error: response.statusText, status: response.status, path: response.url, cause: response})
    }

    constructor(init?: Partial<Error>) {
        Object.assign(this, init);
    }
}

export interface IErrorHandler {
    handleError(error: Error): void;
}

export class API implements IErrorHandler {
    private static _instance: API;
    private errorHandlers: Array<IErrorHandler>;
    private ePackages: Ecore.EPackage[] = [];

    private constructor() {
        this.errorHandlers = [this];
    }

    static instance(): API {
        if (!API._instance) {
            API._instance = new API();
            API._instance.fetchPackages();
        }
        return API._instance;
    }

    private reportError(error: Error): void {
        this.errorHandlers.forEach(h => h.handleError(error))
    }

    addErrorHandler(handler: IErrorHandler) {
        this.errorHandlers.push(handler)
    }

    removeErrorHandler(handler: IErrorHandler) {
        const index = this.errorHandlers.indexOf(handler, 0);
        if (index > -1) {
            this.errorHandlers.splice(index, 1);
        }
    }

    handleError(error: Error): void {
        console.log(error)
    }

    fetchJson(input: RequestInfo, init?: RequestInit): Promise<any> {
        console.log("FETCH: " + input + ' ' + (init?JSON.stringify(init):''));
        return this.fetch(input, init).then(response => response.json());
    }

    fetch(input: RequestInfo, init?: RequestInit): Promise<any> {
        return fetch(input, init).then(response => {
            if (!response.ok) {
                throw response;
            }
            return response
        }).catch((error) => {
            if (error instanceof Error) {
                this.reportError(error)
            } else if (error instanceof Response) {
                let response = error as Response;
                response.json().then(json => {
                    this.reportError(new Error(Object.assign({}, json, {cause: response})));
                }).catch(error => {
                    this.reportError(Error.fromResponce(response));
                })
            } else {
                this.reportError(new Error(Object.assign({}, error, {cause: error})));
            }
            return Promise.reject(error)
        });
    }

    static collectReferences(object: any, found: string[]): string[] {
        if (!object || typeof object !== 'object') {
            return found;
        }
        let ref = object.$ref;
        if (ref) {
            let {id, fragment} = API.parseRef(ref);
            object.$ref = id + '#' + fragment;
            found.push(object.$ref);
        }
        for (var i in object) {
            if (object.hasOwnProperty(i)) {
                API.collectReferences(object[i], found);
            }
        }
        return found;
    }

    static parseRef(ref: string): any {
        let [resid, fragment] = ref.split('#', 2);
        if (!fragment) {
            fragment = '/';
        }
        let [id, query] = resid.split('?', 2);
        let rev = query && query.startsWith("rev=") ? query.substring(4) : undefined;
        return {id, rev, fragment, query, resid};
    }

    saveResource(resource: Ecore.Resource, level: number = 1): Promise<Ecore.Resource> {
        let url = "/emf/resource";
        let uri = resource.get('uri');
        if (uri) {
            let {id} = API.parseRef(uri);
            let rev = resource.rev;
            if (rev) {
                id = id + '?rev=' + rev;
            }
            url = url + '?ref=' + encodeURIComponent(id);
        }
        return this.fetchJson(url, {
            method: "PUT",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(resource.to())
        }).then(json => {
            let {contents, uri} = json;
            let jsonObject = contents[0];
            let resourceSet = Ecore.ResourceSet.create();
            let loading: any = {}
            let promise = this.loadEObjectWithRefs(level, jsonObject, resourceSet, loading, uri);
            loading[API.parseRef(uri).id] = promise;
            return promise;
        })
    }

    fetchResource(ref: string, level: number, resourceSet: Ecore.ResourceSet, loading: any): Promise<Ecore.Resource> {
        let {id, fragment} = API.parseRef(ref);
        let path = id + '#' + fragment;
        if (loading.hasOwnProperty(path)) {
            return loading[path];
        }

        let result = this.fetchJson(`/emf/resource?ref=${encodeURIComponent(ref)}`).then(json => {
            let jsonObject = json.contents[0];
            return this.loadEObjectWithRefs(level, jsonObject, resourceSet, loading, json.uri);
        })
        loading[path] = result;
        return result;
    }

    private loadEObjectWithRefs(level: number, jsonObject: any, resourceSet: Ecore.ResourceSet, loading: any, uri: string): Promise<Ecore.Resource> {
        let refEObjects: Promise<any>[] = []
        if (level > 0) {
            let refs = API.collectReferences(jsonObject, []);
            refEObjects = refs.map(ref => {
                return this.fetchResource(ref, level - 1, resourceSet, loading);
            })
        }
        return Promise.all(refEObjects).then(_ => {
            let {id, rev} = API.parseRef(uri);
            let resource = resourceSet.create({uri: id});
            resource.rev = rev;
            resource.load(jsonObject);
            return resource
        })
    }

    fetchEObject(ref: string, level: number = 1): Promise<Ecore.EObject> {
        let resourceSet = Ecore.ResourceSet.create();
        return this.fetchResource(ref, level, resourceSet, {}).then(_ => {
            let lastResource: Ecore.Resource = resourceSet.get('resources').last();
            return lastResource.get('contents').first();
        })
    }

    fetchPackages(): Promise<Ecore.EPackage[]> {
        if (this.ePackages.length > 0) {
            return Promise.resolve(this.ePackages);
        }
        return this.fetchJson("/emf/packages").then(json => {
            let resourceSet = Ecore.ResourceSet.create();
            for (let aPackage of json as any[]) {
                let uri = aPackage['nsURI'];
                let resource = resourceSet.create({uri});
                resource.load(aPackage);
                resource.get('contents').each((ePackage: Ecore.EPackage) => {
                    Ecore.EPackage.Registry.register(ePackage);
                })
            }
            this.ePackages.push(...Ecore.EPackage.Registry.ePackages());
            return this.ePackages;
        })
    }

    find(selection: any, level: number = 1): Promise<Ecore.Resource[]> {
        return this.fetchJson("/emf/find", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(selection)
        }).then(json => {
            let rs = Ecore.ResourceSet.create();
            let loading = {};
            let promises: Array<Promise<Ecore.Resource>> = [];
            for (let resource of json.resources as any[]) {
                let uri: string = resource.uri;
                let eObjectJson = resource.contents[0]
                eObjectJson._id = API.parseRef(uri).fragment;
                let aPromise = this.loadEObjectWithRefs(level, eObjectJson, rs, loading, uri);
                promises.push(aPromise);
            }
            return Promise.all(promises);
        })
    }

    fetchAllClasses(includeBasicPackages: Boolean = true): Promise<Ecore.EClass[]> {
        const basicPackages: Array<String> = ["ecore", "resources"]
        return this.fetchPackages().then(packages => {
            return packages
                .filter(p=>includeBasicPackages || !basicPackages.includes(p.get('name')))
                .map(p=>p.eContents().filter(c => c.isTypeOf('EClass')))
                .flat() as Ecore.EClass[];
        })
    }

    findByKind(eClass: Ecore.EClass, objectName?: string, level: number = 1): Promise<Ecore.Resource[]> {
        const eAllSubTypes: Ecore.EClass[] = (eClass.get('eAllSubTypes') as Ecore.EClass[]);
        const promises: Promise<Ecore.Resource[]>[] = [eClass, ...eAllSubTypes]
            .filter(c => !c.get('abstract'))
            .map(c => this.findByClass(c, objectName, level));
        return Promise.all(promises).then((resources: Ecore.Resource[][]) => {
            return resources.flat();
        })
    }

    findByClass(eClass: Ecore.EClass, objectName?: string, level: number = 1): Promise<Ecore.Resource[]> {
        return this.findByClassURI(eClass.eURI(), objectName, level);
    }

    findByClassURI(classURI: string, objectName?: string, level: number = 1): Promise<Ecore.Resource[]> {
        let selection: any = {contents: {eClass: classURI}};
        if (objectName) {
            selection.contents['name'] = objectName;
        }
        return this.find(selection, level);
    }

    deleteResource(ref: string): Promise<any> {
        return this.fetchJson(`/emf/resource?ref=${encodeURIComponent(ref)}`, {
            method: "DELETE",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
    }
}