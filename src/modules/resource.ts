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
    constructor(init?:Partial<Error>) {
        Object.assign(this, init);
    }
}

export interface IErrorHandler {
    handleError(error: Error): void;
}

export class Resource implements IErrorHandler {
    private static _instance: Resource;
    private errorHandlers: Array<IErrorHandler>;

    private constructor() {
        this.errorHandlers = [this];
    }

    static instance(): Resource {
        if (!Resource._instance) {
            Resource._instance = new Resource();
        }
        return Resource._instance;
    }

    private reportError(error: Error): void {
        this.errorHandlers.forEach(h=>h.handleError(error))
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
        return this.fetch(input, init).then(response => response.json());
    }

    fetch(input: RequestInfo, init?: RequestInit): Promise<any> {
        return fetch(input, init).then(response=>{
            if (!response.ok) {
                throw response;
            }
            return response
        }).catch((error) => {
            if (error instanceof Error) {
                this.reportError(error)
            }
            else if (error instanceof Response) {
                let response = error as Response;
                response.json().then(json => {
                    this.reportError(new Error(Object.assign({}, json, {cause: response})));
                }).catch(error => {
                    this.reportError(Error.fromResponce(response));
                })
            }
            else {
                this.reportError(new Error(Object.assign({}, error, {cause: error})));
            }
            return Promise.reject(error)
        });
    }

    fetchEObject(ref: string, level: number = 1, resourceSet?: Ecore.ResourceSet, loading?: any): Promise<any> {
        loading = loading || {}
        let rs = resourceSet || Ecore.ResourceSet.create();

        function normalizeRef(ref: string): Array<string> {
            let [resid, fragment] = ref.split('#', 2);
            let id = resid.split('?')[0];
            if (!fragment) {
                fragment = '/';
            }
            return [id, fragment];
        }

        let id = normalizeRef(ref)[0];

        if (loading.hasOwnProperty(id)) {
            return loading[id];
        }

        function collectReferences(object: any, found: string[]): string[] {
            if (typeof object !== 'object') {
                return found;
            }
            let ref = object.$ref;
            if (ref) {
                let [id, fragment] = normalizeRef(ref);
                object.$ref = id + '#' + fragment;
                found.push(object.$ref);
            }
            for(var i in object) {
                if(object.hasOwnProperty(i)){
                    collectReferences(object[i], found);
                }
            }
            return found;
        }

        let result =  this.fetchJson(`/emf/object?ref=${encodeURIComponent(id)}`).then(json=>{
            let refEObjects: Promise<any>[] = []
            if (level > 0) {
                let refs = collectReferences(json, []);
                refEObjects = refs.map(ref=>{
                    return this.fetchEObject(ref, level - 1, rs);
                })
            }
            return Promise.all(refEObjects).then(resources=>{
                let resource = rs.create({ uri: id });
                resource.load(json);
                let eObject = resource.get('contents').first();
                return eObject;
            })
        })
        loading[ref] = result;
        return result;
    }

    fetchPackages(): Promise<Ecore.EPackage[]> {
        return this.fetchJson("/emf/packages").then(json => {
            Ecore.EPackage.Registry.ePackages().splice(2);
            let resourceSet = Ecore.ResourceSet.create();
            for (let aPackage of json as any[]) {
                let uri = aPackage['nsURI'];
                let resource = resourceSet.create({uri});
                resource.load(aPackage);
                resource.get('contents').each((ePackage: Ecore.EPackage) => {
                    Ecore.EPackage.Registry.register(ePackage);
                })
            }
            return Ecore.EPackage.Registry.ePackages()
        })
    }

}