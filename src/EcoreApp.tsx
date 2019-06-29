import * as React from "react";
import { Table } from 'antd';
import 'antd/dist/antd.css';
import {Ecore} from "ecore";

//const Ecore =  require('ecore');

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

    fetchEObject(ref: string, level: number = 1, resourceSet?: Ecore.ResourceSet, loading?: any): Promise<any> {
        loading = loading || {}
        let rs = resourceSet || Ecore.ResourceSet.create();

        let resid = ref.split('#')[0];
        let refid = resid.split('?')[0];

        if (loading.hasOwnProperty(refid)) {
            return loading[refid];
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
                    return this.fetchEObject(ref, level - 1, rs);
                })
            }
            return Promise.all(refEObjects).then(resources=>{
                let resource = rs.create({ uri: resid });
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
                resource.get('contents').each((ePackage: Ecore.EPackage) => {
                    Ecore.EPackage.Registry.register(ePackage);
                })
            }
            this.setState({loaded: true})
        })
        let id: string = '59bb208006149f50bb32f76f4901029b';
        this.fetchEObject(id, 999).then(eObject=>{
            console.log(eObject);
        })
    }

    render() {
        let getId = (eObject: any):  string => {
            //if (eObject._id) return eObject._id;
            return eObject.eURI();
        }
        let getName = (eObject: any): JSX.Element => {
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
            if (eObject.isKindOf('EEnum')) {
                prefix = 'enum ';
            }
            if (eObject.isTypeOf('EDataType')) {
                prefix = 'type ';
            }
            if (eObject.isKindOf('EClass')) {
                if (eObject.get('abstract')) {
                    prefix = prefix + 'abstract ';
                }
                if (eObject.get('interface')) {
                    prefix = prefix + 'interface ';
                }
                else {
                    prefix = prefix + 'class ';
                }
                let eSuperTypes = (eObject.get('eSuperTypes') as any[]).filter(e => e.get('name') !== 'EObject')
                if (eSuperTypes.length > 0) {
                    postfix = " extends " + eSuperTypes.map(e=>e.get('name')).join(", ")
                }
            }
            if (eObject.isKindOf('EOperation')) {
                let eType = eObject.get('eType');
                if (eType) {
                    prefix = eType.get('name') + ' ';
                }
                else {
                    console.log(eObject);
                }
                let eParameters = eObject.get('eParameters') as any[]
                postfix = '(' + eParameters.map(p=>{
                    return p.get('eType').get('name') + ' ' + p.get('name')
                }).join(', ') + ')';
            }
            return <span>{prefix}<b>{name}</b>{postfix}</span>;
        }
        let data: any[] = []
        for (let ePackage of Ecore.EPackage.Registry.ePackages()) {
            let children: any[] = []
            data.push({key: getId(ePackage), name: getName(ePackage), type: ePackage.eClass.get('name'), children})
            for (let eClassifier of ePackage.get('eClassifiers').array()) {
                let children2: any[] = []
                children.push({key: getId(eClassifier), name: getName(eClassifier), type: eClassifier.eClass.get('name'), children: children2});
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
                        children2.push({key: getId(eOperation), name: getName(eOperation), type: eOperation.eClass.get('name')})
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