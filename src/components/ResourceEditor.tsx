import * as React from "react";
import { Tree, Icon, Table } from 'antd';
import { Ecore } from "ecore";
import {API} from "../modules/api";
//import SplitPane from 'react-split-pane';
//import Pane from 'react-split-pane/lib/Pane';
import Splitter from 'm-react-splitters'
//import update from 'immutability-helper';
//import _filter from 'lodash/filter'
//import _map from 'lodash/map'

interface ITargetObject {
    [key: string]: string;
}

export interface Props {
}

interface State {
    resource: Ecore.EObject,
    resourceJSON: Object,
    ePackages: Ecore.EPackage[],
    selectedNodeName: string|undefined,
    tableData: Array<any>
}

export class ResourceEditor extends React.Component<any, State> {

    private splitterRef: React.RefObject<any>

    constructor(props: any) {
        super(props);
        this.splitterRef = React.createRef();
    }

    state = {
        resource: {} as Ecore.EObject,
        resourceJSON: {},
        ePackages: [],
        selectedNodeName: undefined,
        tableData: []
    }

    getPackages(): void{
        API.instance().fetchPackages().then(packages=>{
            this.setState({ePackages: packages})
        })
    }

    getResource(): void {
        API.instance().fetchEObject(`${this.props.match.params.id}?ref=${this.props.match.params.ref}`).then(resource=>{
            this.setState({ resource: resource, resourceJSON: resource.eResource().to() })
        })
    }

    updateProperty(property:string, value:any){
        //const updated = update(this.state.resourceJSON,)
        //this.setState({ resourceJSON: updated })
    }

    createPropertyTable() {
        return (
            <Table bordered 
                size="small"
                pagination={false}
                //components={this.components} 
                columns={[
                    {
                        title: 'Property',
                        dataIndex: 'property',
                        width: 300
                    },
                    {
                        title: 'Value',
                        dataIndex: 'value'
                    },]}
                dataSource={this.state.tableData} 
            />
        )
    }

    createTree() {
        return (
            <Tree
                showIcon
                defaultExpandAll
                switcherIcon={<Icon type="down" />}
                onSelect={this.onTreeSelect}
            >
                <Tree.TreeNode style={{fontWeight: '600'}} icon={<Icon type="cluster" />} title={this.state.resource.eClass.get('name')} key={this.state.resource._id}>
                    {this.state.resource.eContents().map((res,idx) => 
                        <Tree.TreeNode key={res._id} eClass={res} icon={<Icon type="block"/>} title={res.eClass.get('name')} />)}
                </Tree.TreeNode>
            </Tree>
        )
    }

    findObjectById(data:any, id:String):any{

        function walkThroughArray(array:Array<any>): any{
            for(var el of array) {
                if (el._id && el._id === id) return el
            }
        }

        if(data._id === id) return data

        if(Array.isArray(data)){
            return walkThroughArray(data)
        }else{
            let result
            Object.entries(data).forEach(([key, value]) => {
                if (Array.isArray(value)) result = this.findObjectById(value, id)
            })
            return result
        }
    }

    onTreeSelect = (selectedKeys:Array<String>, e:any) => {
        if(selectedKeys[0]){
            const targetObject = this.findObjectById(this.state.resourceJSON, selectedKeys[0])
            this.setState({ tableData: this.prepareTableData(this.state.resourceJSON, targetObject, this.state.resource) })
        }
    }

    prepareTableData(data:Object, targetObject:ITargetObject ,resource:Ecore.EObject): Array<any> {

        //const targetObject = this.findObjectById(this.state.resourceJSON, selectedKeys[0])
        const featureList = resource.eContainer.getEObject(targetObject._id).eClass.get('eStructuralFeatures').array()
        const preparedData = featureList.map((feature:Ecore.EObject)=>({property: feature.get('name'), value: Array.isArray(targetObject[feature.get('name')]) ? JSON.stringify(targetObject[feature.get('name')]) : targetObject[feature.get('name')]}))


        /*
        const exludedKeys: Array<String> = ["_id", "eClass"]
        const tableData:Array<any> = []
        function isContained(eFeatureName:string):Boolean {
            const wantedStructuralFeature = resource.eClass
                .get('eStructuralFeatures')
                .array()
                .find((feature:Ecore.EStructuralFeature) => feature.get('name') === eFeatureName)
            const contaiment = Boolean(wantedStructuralFeature.get('containment')) === true
            return contaiment
        }

        Object.entries(data).forEach(([key, value]) => {
            if(!exludedKeys.includes(key)){
                isContained(key) && tableData.push({ property: key, value: Array.isArray(value) ? JSON.stringify(value) : value })
            }
        })
        */
        return preparedData
    }

    componentDidMount(): void {
        this.getPackages()
        this.getResource()
    }

    render() {
        return (
                <div style={{display: 'flex', flexFlow: 'column', height: '100%'}}>
                    <div style={{ flexGrow: 1 }}>
                    <Splitter
                        ref={this.splitterRef}
                        position="horizontal"
                        primaryPaneMaxHeight="80%"
                        primaryPaneMinHeight={0}
                        primaryPaneHeight={localStorage.getItem('resource_splitter_pos') || "400px"}
                        dispatchResize={true}
                        postPoned={false}
                        onDragFinished={()=>{
                            const size:string = this.splitterRef.current!.panePrimary.props.style.height
                            localStorage.setItem('resource_splitter_pos', size)
                        }}
                    >
                            <div className="view-box" style={{ height: '100%', width: '100%', overflow: 'auto' }}>
                                {this.state.resource.eClass && this.createTree()}
                            </div>
                            <div style={{ height: '100%', width: '100%', overflow: 'auto', backgroundColor: '#fff' }}>
                                {this.createPropertyTable()}
                            </div>
                        </Splitter>
                    </div>
                </div>
        );
    }
}