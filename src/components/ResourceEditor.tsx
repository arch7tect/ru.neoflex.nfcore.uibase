import * as React from "react";
import { Tree, Icon, Table } from 'antd';
import { Ecore } from "ecore";
import {API} from "../modules/api";
//import SplitPane from 'react-split-pane';
//import Pane from 'react-split-pane/lib/Pane';
import Splitter from 'm-react-splitters'
import update from 'immutability-helper';
//import { any } from "prop-types";
//import _filter from 'lodash/filter'
//import _map from 'lodash/map'
import EditableTextArea from './EditableTextArea'

interface ITargetObject {
    [key: string]: any;
}

export interface Props {
}

interface State {
    resource: Ecore.EObject,
    resourceJSON: Object,
    ePackages: Ecore.EPackage[],
    selectedNodeName: string|undefined,
    tableData: Array<any>,
    targetObject: Object
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
        tableData: [],
        targetObject: {}
    }

    getPackages(): void{
        API.instance().fetchPackages().then(packages=>{
            this.setState({ePackages: packages})
        })
    }

    getResource(): void {
        API.instance().fetchEObject(`${this.props.match.params.id}?ref=${this.props.match.params.ref}`).then(resource=>{
            this.setState({ 
                resource: resource, 
                resourceJSON: this.nestUpdaters(resource.eResource().to(), null) 
            })
        })
    }

    /**
     * Creates updaters for all levels of object, including for objects in arrays.
     */
    nestUpdaters(json:any, parentObject:any = null, property?:String): Object {

        const createUpdater = (data: Object, init_idx?:Number) => {
            return function (newValues: Object, indexForParentUpdater?: any, targetArray?:any) {
                    const currentObject = data
                    const idx:any = init_idx
                    const prop:any = property
                    const parent = parentObject
                    let updatedData
                    if(targetArray){
                        updatedData = update(currentObject as any, { [targetArray]: { [indexForParentUpdater]: { $merge: newValues } } }) 
                    }else{
                        updatedData = update(currentObject, {$merge: newValues})
                    }
                    return parent && parent.updater ? parent.updater(updatedData, idx, prop) : updatedData
                }
        }

        const walkThroughArray = (array:Array<any>) =>{
            array.forEach((obj, index) => {
                obj.updater = createUpdater(obj, index)
                walkThroughObject(obj)
            })
        }

        const walkThroughObject = (obj:any) => {
            //cause if we go from walkThroughArray we'll rewrite updater, so we have to check if(!obj.updater)
            if(!obj.updater) obj.updater = createUpdater(obj)

            Object.entries(obj).forEach(([key, value]) => {
                if (Array.isArray(value)) this.nestUpdaters(value, obj, key)
            })
        }

        if(Array.isArray(json)){
            walkThroughArray(json)
        }else{
            walkThroughObject(json)
        }

        return json
    }

    createPropertyTable() {
        return (
            <Table bordered 
                size="small"
                pagination={false}
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

        function generateNodes(resource:Ecore.EObject):Array<any>{
            return resource.eContents().map((res,idx) => 
                <Tree.TreeNode key={res._id} eClass={res} icon={<Icon type="block"/>} title={res.eClass.get('name')}>
                    {res.eContents().length > 0 && generateNodes(res)}
                </Tree.TreeNode>
            )
        }

        return (
            <Tree
                showIcon
                defaultExpandAll
                switcherIcon={<Icon type="down" />}
                onSelect={this.onTreeSelect}
            >
                <Tree.TreeNode style={{fontWeight: '600'}} icon={<Icon type="cluster" />} title={this.state.resource.eClass.get('name')} key={this.state.resource._id}>
                    {generateNodes(this.state.resource)}
                </Tree.TreeNode>
            </Tree>
        )
    }

    findObjectById(data:any, id:String):any{

        const walkThroughArray = (array:Array<any>): any =>{
            for(var el of array) {
                if (el._id && el._id === id) {
                    return el
                }else{
                    const result = this.findObjectById(el, id)
                    if(result) return result
                }
            }
        }

        const walkThroughObject = (obj:Object):any => {
            let result
            Object.entries(obj).forEach(([key, value]) => {
                if (Array.isArray(value)) result = this.findObjectById(value, id)
            })
            if(result) return result
        }

        if(data._id === id) return data

        if(Array.isArray(data)){
            return walkThroughArray(data)
        }else{
            return walkThroughObject(data)
        }
    }

    onTreeSelect = (selectedKeys:Array<String>, e:any) => {
        if(selectedKeys[0]){
            const targetObject = this.findObjectById(this.state.resourceJSON, selectedKeys[0])
            this.setState({ 
                tableData: this.prepareTableData(this.state.resourceJSON, targetObject, this.state.resource),
                targetObject: targetObject
            })
        }
    }

    prepareTableData(data:Object, targetObject:ITargetObject ,resource:Ecore.EObject): Array<any> {

        const prepareValue = (key:string, value:any):any => {
            if(Array.isArray(value)){
                const elements = value.map((el,idx) => <React.Fragment key={idx}>{JSON.stringify(el)}<br/></React.Fragment>)
                const component = <React.Fragment>
                    {elements}
                    <button>...</button>    
                </React.Fragment>
                return component
            }else{
                return <EditableTextArea
                    editedProperty={key} 
                    value={value} 
                    onChange={(newValue:Object)=>
                        this.setState({ resourceJSON: targetObject.updater(newValue) })} 
                />
            }
        }

        //const targetObject = this.findObjectById(this.state.resourceJSON, selectedKeys[0])
        const featureList = resource.eContainer.getEObject(targetObject._id).eClass.get('eStructuralFeatures').array()
        const preparedData = featureList.map((feature:Ecore.EObject, idx:Number)=>({property: feature.get('name'), value: prepareValue(feature.get('name'), targetObject[feature.get('name')]), key: feature.get('name')+idx }))

        return preparedData
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        //if((this.state.resourceJSON !== prevState.resourceJSON) && 
            //Object.keys(this.state.resource).length > 0 &&
            //Object.keys(this.state.targetObject){
            //this.prepareTableData(this.state.resourceJSON, this.state.targetObject, this.state.resource)
        //}
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