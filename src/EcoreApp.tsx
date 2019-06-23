import * as React from "react";
import { Table } from 'antd';
import 'antd/dist/antd.css';
const Ecore =  require('ecore');

export interface Props {
    name: string;
}

interface State {
}

export class EcoreApp extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {}
    }

    fetchJson(input: RequestInfo, init?: RequestInit): Promise<any> {
        return fetch(input, init).then(response=>{
            if (!response.ok) {
                response.json().then(json => {
                    console.log(json.message, response.statusText);
                }).catch(error => {
                    console.log(response.statusText);
                })
                throw Error()
            }
            return response
        }).catch(error => {
            if (error && error.message) {
                console.log(error.message);
            }
            return Promise.reject()
        }).then(response => response.json());
    }

    fetchEObject(ref: string, level: number = 1, resourceSet?: any, loading?: any): Promise<any> {
        let resid = ref.split('#')[0];
        let refid = resid.split('?')[0];

        if (!loading) {
            loading = {};
        }

        if (loading.hasOwnProperty(refid)) {
            return loading[refid];
        }

        if (!resourceSet ) {
            resourceSet = Ecore.ResourceSet.create();
        }

        function collectReferences(object: any, found: string[]): string[] {
            if (typeof object !== 'object') {
                return found;
            }
            let ref = object.$ref;
            if (ref) {
                found.push(ref);
            }
            for(var i in object) {
                if(object.hasOwnProperty(i)){
                    collectReferences(object[i], found);
                }
            }
            return found;
        }

        let result =  this.fetchJson(`/emf/object?ref=${refid}`).then(json=>{
            let refEObjects: Promise<any>[] = []
            if (level > 0) {
                let refs = collectReferences(json, []);
                refEObjects = refs.map(ref=>{
                    return this.fetchEObject(ref, level - 1, resourceSet);
                })
            }
            return Promise.all(refEObjects).then(resources=>{
                let resource = resourceSet.create({ uri: resid });
                resource.load(json);
                let eObject = resource.get('contents').first();
                return eObject;
            })
        })
        loading[refid] = result;
        return result;
    }

    componentDidMount(): void {
        this.fetchJson("/emf/packages").then(json => {
            let resourceSet = Ecore.ResourceSet.create();
            for (let aPackage of json as any[]) {
                let uri = aPackage['nsURI'];
                let resource = resourceSet.create({ uri });
                resource.load(aPackage);
                resource.get('contents').each((ePackage: any) => {
                    Ecore.EPackage.Registry.register(ePackage);
                })
            }
            this.setState({loaded: true})
        })
        let id: string = '80e3cf351c5fc42ca3db8be9390520d5';
        this.fetchEObject(id).then(eObject=>{
            console.log(eObject);
        })
    }

    render() {
        let getId = (eObject: any):  string => {
            //if (eObject._id) return eObject._id;
            return eObject.eURI();
        }
        let getName = (eObject: any): string => {
            let prefix: string = '';
            let name: string = eObject.get('name');
            let postfix: string = '';
            if (eObject.isKindOf('EReference')) {
                let isContainment = Boolean(eObject.get('containment')) === true;
                if (isContainment) {
                    prefix = prefix + 'contains ';
                }
                else {
                    prefix = prefix + 'refers ';
                }
                let eReferenceType = eObject.get('eType');
                if (eReferenceType) {
                    let typeName = eReferenceType.get('name');
                    prefix = prefix + typeName;
                }
            }
            if (eObject.isKindOf('EAttribute')) {
                let eType = eObject.get('eType');
                if (eType) {
                    let typeName = eType.get('name');
                    prefix = prefix + typeName;
                }
            }
            if (eObject.isKindOf('EStructuralFeature')) {
                let upperBound = eObject.get('upperBound')
                if (upperBound && upperBound !== 1) {
                    prefix = prefix + '[] ';
                }
                else {
                    prefix = prefix + ' ';
                }
            }
            return prefix + name + postfix;
        }
        let data: any[] = []
        for (let ePackage of Ecore.EPackage.Registry.ePackages()) {
            let children: any[] = []
            data.push({key: getId(ePackage), name: ePackage.get('nsURI'), type: ePackage.eClass.get('name'), children})
            for (let eClassifier of ePackage.get('eClassifiers').array()) {
                let children2: any[] = []
                children.push({key: getId(eClassifier), name: eClassifier.get('name'), type: eClassifier.eClass.get('name'), children: children2});
                let eStructuralFeatures = eClassifier.get('eStructuralFeatures');
                if (eStructuralFeatures) {
                    for (let eStructuralFeature of eStructuralFeatures.array()) {
                        children2.push({key: getId(eStructuralFeature), name: getName(eStructuralFeature), type: eStructuralFeature.eClass.get('name')})
                    }
                }
                let eLiterals = eClassifier.get('eLiterals');
                if (eLiterals) {
                    for (let eLiteral of eLiterals.array()) {
                        children2.push({key: getId(eLiteral), name: eLiteral.get('name'), type: eLiteral.eClass.get('name')})
                    }
                }
                let eOperations = eClassifier.get('eOperations');
                if (eOperations) {
                    for (let eOperation of eOperations.array()) {
                        children2.push({key: getId(eOperation), name: eOperation.get('name'), type: eOperation.eClass.get('name')})
                    }
                }
            }
        }
        return (
            <Table dataSource={data} pagination={false}>
                <Table.Column title="Name" dataIndex="name" key="name"/>
                <Table.Column title="Type" dataIndex="type" key="type"/>
                <Table.Column title="URI" dataIndex="key" key="key"/>
            </Table>
        );
    }
}