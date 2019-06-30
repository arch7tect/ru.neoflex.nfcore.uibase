import * as React from "react";
import {Table} from 'antd';
import 'antd/dist/antd.css';
import {Ecore} from "ecore";
import {Resource} from './modules/resource'

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

    componentDidMount(): void {
        Resource.instance().fetchPackages().then(packages=>{
            this.setState({loaded: true})
        })
        let id: string = '80e3cf351c5fc42ca3db8be939060fbe';
        Resource.instance().fetchEObject(id, 999).then(eObject => {
            console.log(eObject.eResource().to());
        })
    }

    render() {
        let getId = (eObject: any): string => {
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
                } else {
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
                } else {
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
                } else {
                    prefix = prefix + 'class ';
                }
                let eSuperTypes = (eObject.get('eSuperTypes') as any[]).filter(e => e.get('name') !== 'EObject')
                if (eSuperTypes.length > 0) {
                    postfix = " extends " + eSuperTypes.map(e => e.get('name')).join(", ")
                }
            }
            if (eObject.isKindOf('EOperation')) {
                let eType = eObject.get('eType');
                if (eType) {
                    prefix = eType.get('name') + ' ';
                }
                let eParameters = eObject.get('eParameters') as any[]
                postfix = '(' + eParameters.map(p => {
                    return p.get('eType').get('name') + ' ' + p.get('name')
                }).join(', ') + ')';
            }
            return <span>{prefix}<b>{name}</b>{postfix}</span>;
        }
        let data: any[] = []
        for (let ePackage of Ecore.EPackage.Registry.ePackages()) {
            let eClassifiers: any[] = []
            data.push({key: getId(ePackage), name: getName(ePackage), type: ePackage.eClass.get('name'), children: eClassifiers})
            for (let eClassifier of ePackage.get('eClassifiers').array()) {
                let children2: any[] = []
                let child = {
                    key: getId(eClassifier),
                    name: getName(eClassifier),
                    type: eClassifier.eClass.get('name'),
                    children: children2
                };
                eClassifiers.push(child);
                let eStructuralFeatures = eClassifier.get('eStructuralFeatures');
                if (eStructuralFeatures) {
                    for (let eStructuralFeature of eStructuralFeatures.array()) {
                        children2.push({
                            key: getId(eStructuralFeature),
                            name: getName(eStructuralFeature),
                            type: eStructuralFeature.eClass.get('name')
                        })
                    }
                }
                let eLiterals = eClassifier.get('eLiterals');
                if (eLiterals) {
                    for (let eLiteral of eLiterals.array()) {
                        children2.push({
                            key: getId(eLiteral),
                            name: eLiteral.get('name'),
                            type: eLiteral.eClass.get('name')
                        })
                    }
                }
                let eOperations = eClassifier.get('eOperations');
                if (eOperations) {
                    for (let eOperation of eOperations.array()) {
                        children2.push({
                            key: getId(eOperation),
                            name: getName(eOperation),
                            type: eOperation.eClass.get('name')
                        })
                    }
                }
                if (children2.length === 0) {
                    delete child['children']
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