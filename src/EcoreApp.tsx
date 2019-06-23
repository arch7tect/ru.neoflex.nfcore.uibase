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

    componentDidMount(): void {
        fetch("/emf/packages").then(response=>{
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
        }).then(response => response.json()).then(json => {
            console.log(json);
            let resourceSet = Ecore.ResourceSet.create();
            let resource = resourceSet.create({ uri: 'http://datagram' });
            resource.load(json);
            resource.get('contents').each((ePackage: any) => {
                Ecore.EPackage.Registry.register(ePackage);
            })
            this.setState({loaded: true})
            console.log(Ecore.EPackage.Registry.ePackages());
            console.log(Ecore.EPackage.Registry.elements());
        })
    }

    render() {
        let data: any[] = []
        for (let ePackage of Ecore.EPackage.Registry.ePackages()) {
            let children: any[] = []
            data.push({key: ePackage.eURI(), name: ePackage.get('nsURI'), type: ePackage.eClass.get('name'), children})
            for (let eClassifier of ePackage.get('eClassifiers').array()) {
                let children2: any[] = []
                children.push({key: eClassifier.eURI(), name: eClassifier.get('name'), type: eClassifier.eClass.get('name'), children: children2});
                let eStructuralFeatures = eClassifier.get('eStructuralFeatures');
                if (eStructuralFeatures) {
                    for (let eStructuralFeature of eStructuralFeatures.array()) {
                        children2.push({key: eStructuralFeature.eURI(), name: eStructuralFeature.get('name'), type: eStructuralFeature.eClass.get('name')})
                    }
                }
                let eLiterals = eClassifier.get('eLiterals');
                if (eLiterals) {
                    for (let eLiteral of eLiterals.array()) {
                        children2.push({key: eLiteral.eURI(), name: eLiteral.get('name'), type: eLiteral.eClass.get('name')})
                    }
                }
            }
        }
        return (
            <Table dataSource={data} >
                <Table.Column title="Name" dataIndex="name" key="name"/>
                <Table.Column title="Type" dataIndex="type" key="type"/>
                <Table.Column title="URI" dataIndex="key" key="key"/>
            </Table>
        );
    }
}