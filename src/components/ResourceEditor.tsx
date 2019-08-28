import * as React from "react";
import {Button, Col, Icon, Modal, Row, Select, Table, Tree} from 'antd';
import Ecore from "ecore";
import {API} from "../modules/api";
import Splitter from './CustomSplitter'
import update from 'immutability-helper';
//import { any } from "prop-types";
//import _filter from 'lodash/filter'
//import _map from 'lodash/map'
import EditableTextArea from './EditableTextArea'
import ResourceSearchTrans from "./ResourceSearch";

export interface Props {
}

interface State {
    resource: Ecore.EObject,
    resourceJSON: { [key: string]: any },
    ePackages: Ecore.EPackage[],
    selectedNodeName: string | undefined,
    tableData: Array<any>,
    targetObject: Object,
    selectedKey: String,
    modalVisible: Boolean,
    rightClickMenuVisible: Boolean,
    rightMenuPosition: Object,
    uniqKey: String,
    treeRightClickEClass: String
}

export class ResourceEditor extends React.Component<any, State> {

    private splitterRef: React.RefObject<any>;

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
        targetObject: {},
        selectedKey: "",
        modalVisible: false,
        rightClickMenuVisible: false,
        rightMenuPosition: {x:100,y:100},
        uniqKey: "",
        treeRightClickEClass: "",
    };

    getPackages(): void {
        API.instance().fetchPackages().then(packages => {
            this.setState({ ePackages: packages })
        })
    }

    getResource(): void {
        API.instance().fetchEObject(`${this.props.match.params.id}?ref=${this.props.match.params.ref}`).then(resource => {
            this.setState({
                resource: resource,
                resourceJSON: this.nestUpdaters(resource.eResource().to(), null)
            })
        })
    }

    /**
     * Creates updaters for all levels of an object, including for objects in arrays.
     */
    nestUpdaters(json: any, parentObject: any = null, property?: String): Object {

        const createUpdater = (data: Object, init_idx?: Number) => {
            return function updater(newValues: Object, indexForParentUpdater?: any, updaterProperty?: any) {
                const currentObject = data;
                const idx: any = init_idx;
                const prop: any = property;
                const parent = parentObject;
                let updatedData;
                if (updaterProperty) {
                    if(indexForParentUpdater !== undefined){
                        updatedData = update(currentObject as any, { [updaterProperty]: { [indexForParentUpdater]: { $merge: newValues } } })
                    }else{
                        updatedData = update(currentObject as any, { [updaterProperty]: {  $merge: newValues } })
                    }
                } else {
                    updatedData = update(currentObject, { $merge: newValues })
                }
                return parent && parent.updater ? parent.updater(updatedData, idx, prop) : updatedData
            }
        };

        const walkThroughArray = (array: Array<any>) => {
            array.forEach((obj, index) => {
                //we have to check the type, cause it can be an array of strings, for e.g.
                if(typeof obj === "object"){
                    walkThroughObject(obj)
                    obj.updater = createUpdater(obj, index)
                }
            })
        };

        const walkThroughObject = (obj: any) => {
            obj.updater = createUpdater(obj);
            Object.entries(obj).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    this.nestUpdaters(value, obj, key)
                }else{
                    if (value instanceof Object && typeof value === "object") this.nestUpdaters(value, obj, key)
                }
            })
        };

        if (Array.isArray(json)) {
            walkThroughArray(json)
        } else {
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

    findObjectById(data: any, id: String): any {

        const walkThroughArray = (array: Array<any>): any => {
            for (var el of array) {
                if (el._id && el._id === id) {
                    return el
                } else {
                    const result = this.findObjectById(el, id);
                    if (result) return result
                }
            }
        };

        const walkThroughObject = (obj: any): any => {
            let result;

            for(let prop in obj){
                if(result) {
                    break
                }
                if (Array.isArray(obj[prop])) {
                    result = this.findObjectById(obj[prop], id)
                }else{
                    if (obj[prop] instanceof Object && typeof obj[prop] === "object") result = this.findObjectById(obj[prop], id)
                }
            }
            if (result) return result
        };

        if (data._id === id) return data;

        if (Array.isArray(data)) {
            return walkThroughArray(data)
        } else {
            return walkThroughObject(data)
        }
    }

    createTree() {

        const generateNodes = (eClass: Ecore.EObject, json: { [key: string]: any }): Array<any> => {
                return eClass.get('eAllStructuralFeatures') && eClass.get('eAllStructuralFeatures').map((feature: Ecore.EObject, idx: Number) => {
                    const isContainment = Boolean(feature.get('containment'));
                    const upperBound = feature.get('upperBound')
                    if ((upperBound === -1 || upperBound === 1) && isContainment) {
                        const targetObject = Array.isArray(json[feature.get('name')]) ? json[feature.get('name')] : [json[feature.get('name')]]
                        return <Tree.TreeNode array={true} key={feature.get('name') + idx} eClass={feature.get('eType').eURI()} targetObject={targetObject} icon={<Icon type="block" />} title={feature.get('name')}>
                            {targetObject.map((object:{ [key: string]: any })=>{
                                const eClass = Ecore.ResourceSet.create().getEObject(object.eClass)
                                return <Tree.TreeNode key={feature.get('eType').get('name') + "." + idx} eClass={object.eClass ? object.eClass : feature.get('eType').eURI()} targetObject={object} icon={<Icon type="block" />} title={feature.get('eType').get('name')}>
                                    {generateNodes(eClass, object)}
                                </Tree.TreeNode>
                            })}
                        </Tree.TreeNode>
                    }
                    return null
                }
            )
        }

        return (
            <Tree
                showIcon
                defaultExpandAll
                switcherIcon={<Icon type="down" />}
                onSelect={this.onTreeSelect}
                onRightClick={this.onRightClick}
            >
                <Tree.TreeNode style={{ fontWeight: '600' }} eClass={this.state.resource.eClass.eURI()} targetObject={this.state.resourceJSON} icon={<Icon type="cluster" />} title={this.state.resource.eClass.get('name')} key={this.state.resource._id}>
                    {generateNodes(this.state.resource.eClass, this.state.resourceJSON)}
                </Tree.TreeNode>
            </Tree>
        )
    }

    onTreeSelect = (selectedKeys: Array<String>, e: any) => {
        if (selectedKeys[0] && !e.node.props.array) {
            const targetObject = e.node.props.targetObject
            const uniqKey = e.node.props.eventKey
            this.setState({
                tableData: this.prepareTableData(targetObject, this.state.resource, uniqKey),
                targetObject: targetObject,
                selectedKey: selectedKeys[0],
                uniqKey: uniqKey
            })
        }else{
            this.setState({
                tableData: [],
                targetObject: e.node.props.targetObject,
                selectedKey: selectedKeys[0]
            })
        }
    };

    onRightClick = (e:any) => {
        //const eClass = e.node.props.eClass
        //const eObject = Ecore.ResourceSet.create().getEObject(eClass)
        //const siblings = Ecore.Edit.siblingTypes(eObject, null); 
        //eObject.get('eAllSubTypes')

        this.setState({ rightClickMenuVisible: true, rightMenuPosition: { x: e.event.clientX, y: e.event.clientY }, treeRightClickEClass: e.node.props.eClass })
    };

    prepareTableData(targetObject: {[key: string]: any;}, resource: Ecore.EObject, key: String): Array<any> {

        const boolSelectionOption: { [key: string]: any } = { "null": null, "true": true, "false": false }
        const getPrimitiveType = (value:string):any => boolSelectionOption[value]
        const convertPrimitiveToString = (value:string):any => String(boolSelectionOption[value])

        const prepareValue = (eObject: Ecore.EObject, value: any, idx:Number): any => {
            if (eObject.isKindOf('EReference')) {
                const elements = value ? value.map((el: Object, idx: number) => <React.Fragment key={idx}>{JSON.stringify(el)}<br /></React.Fragment>) : []
                const component = <React.Fragment key={key+"_"+idx}>
                    {elements}
                    <Button key={key+"_"+idx} onClick={()=>this.setState({ modalVisible: true })}>...</Button>
                </React.Fragment>
                return component
            } else if (eObject.get('eType').isKindOf('EDataType') && eObject.get('eType').get('name') === "EBoolean") {
                return <Select value={convertPrimitiveToString(value)} key={key+"_"+idx} style={{ width: "300px" }} onChange={(newValue: any) => {
                        const updatedJSON = targetObject.updater({ [eObject.get('name')]: getPrimitiveType(newValue) });
                        const updatedTargetObject = this.findObjectById(updatedJSON, targetObject._id);
                        this.setState({ resourceJSON: updatedJSON, targetObject: updatedTargetObject })
                    }}>
                        {Object.keys(boolSelectionOption).map((value:any)=>
                            <Select.Option key={key+"_"+value+"_"+key} value={value}>{value}</Select.Option>)}
                </Select>
            } else if (eObject.get('eType').isKindOf('EEnum')){
                return <Select value={value} key={key+"_"+idx} style={{ width: "300px" }} onChange={(newValue: any) => {
                    const updatedJSON = targetObject.updater({ [eObject.get('name')]: newValue });
                    const updatedTargetObject = this.findObjectById(updatedJSON, targetObject._id);
                    this.setState({ resourceJSON: updatedJSON, targetObject: updatedTargetObject })
                }}>
                    {eObject.get('eType').eContents().map((obj:Ecore.EObject)=>
                        <Select.Option key={key+"_opt_"+obj.get('name')+"_"+targetObject.id} value={obj.get('name')}>{obj.get('name')}</Select.Option>)}
                </Select>
            } else {
                return <EditableTextArea
                    key={key+"_"+idx}
                    editedProperty={eObject.get('name')}
                    value={value}
                    onChange={(newValue: Object) => {
                        const updatedJSON = targetObject.updater(newValue);
                        const updatedTargetObject = this.findObjectById(updatedJSON, targetObject._id);
                        this.setState({ resourceJSON: updatedJSON, targetObject: updatedTargetObject })
                    }}
                />
            }
        }

        const preparedData:Array<Object> = [];
        const featureList = resource.eContainer.getEObject(targetObject._id).eClass.get('eAllStructuralFeatures')
        featureList.forEach((feature: Ecore.EObject, idx: Number) => {
            const isContainment = Boolean(feature.get('containment'));
            if(!isContainment) preparedData.push({ 
                property: feature.get('name'), 
                value: prepareValue(feature, targetObject[feature.get('name')], idx), 
                key: feature.get('name') + idx })
        })

        return preparedData
    }

    handleModalOk = () => {
        this.setState({ modalVisible: false })
    };

    handleModalCancel = () => {
        this.setState({ modalVisible: false })
    };

    hideRightClickMenu = (e:any) => {
        this.setState({ rightClickMenuVisible: false })
    };

    renderRightMenu():any {
        const eClass = this.state.treeRightClickEClass
        const eObject = Ecore.ResourceSet.create().getEObject(eClass)
        const allSubTypes = eObject.get('eAllSubTypes')
        return <div className="right-menu" style={{
            position: "absolute",
            display: "grid",
            boxShadow: "2px 2px 8px -1px #cacaca",
            borderRadius: "4px",
            minHeight: "10px",
            maxHeight: "100%",
            minWidth: "100px",
            maxWidth: "300px",
            left: this.state.rightMenuPosition.x,
            top: this.state.rightMenuPosition.y,
            backgroundColor: "#fff",
            padding: "7px",
            lineHeight: 2
        }}>
            {allSubTypes.map((type:Ecore.EObject, idx:Number) => 
                type.get('abstract') ? 
                    undefined 
                : 
                    <button key={"menu_"+idx} className="menu-button" onClick={this.handleAddChild}>
                        {type.get('name')}
                    </button>)}
            <button className="menu-delete-button" style={{borderTop: allSubTypes.length > 0 ? "1px solid #f2f2f2" : ""}}>Delete</button>
            
        </div>
    }

    handleAddChild = (e:any) => {
        e.preventDefault()
        /*const eClass = this.state.treeRightClickEClass
        const eObject = Ecore.ResourceSet.create().getEObject(eClass)
        const allSubTypes = eObject.get('eAllSubTypes')*/
    }

    handleDeleteChild = (e:any) => {
        e.preventDefault()
    }

    handleSelect = (resources : Ecore.Resource[]): void => {
        this.setState({ modalVisible: false })
    };

    componentWillUnmount() {
        window.removeEventListener("click", this.hideRightClickMenu)
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        //that means resourceJSON was edited and updated
        if(this.state.resourceJSON !== prevState.resourceJSON && Object.keys(this.state.targetObject).length > 0){
            const nestedJSON = this.nestUpdaters(this.state.resourceJSON, null);
            const preparedData = this.prepareTableData(this.state.targetObject, this.state.resource, this.state.uniqKey);
            this.setState({ resourceJSON: nestedJSON, tableData: preparedData })
        }
    }

    componentDidMount(): void {
        this.getPackages();
        this.getResource();
        window.addEventListener("click", this.hideRightClickMenu)
    }

    render() {
        return (
            <div style={{ display: 'flex', flexFlow: 'column', height: '100%' }}>
                <div style={{ flexGrow: 1 }}>
                    <Splitter
                        ref={this.splitterRef}
                        position="horizontal"
                        primaryPaneMaxHeight="90%"
                        primaryPaneMinHeight={"10%"}
                        primaryPaneHeight={localStorage.getItem('resource_splitter_pos') || "400px"}
                        dispatchResize={true}
                        postPoned={false}
                        onDragFinished={() => {
                            const size: string = this.splitterRef.current!.panePrimary.props.style.height
                            localStorage.setItem('resource_splitter_pos', size)
                        }}
                    >
                        <div className="view-box" style={{ height: '100%', width: '100%', overflow: 'auto' }}>
                            <Row>
                                <Col span={23}>
                                    {this.state.resource.eClass && this.createTree()}
                                </Col>
                                <Col span={1}>
                                    <Button icon="plus" type="primary" style={{ marginLeft: '20px' }} shape="circle" size="large" onClick={()=>this.setState({ modalVisible: true })}></Button>
                                </Col>
                            </Row>
                        </div>
                        <div style={{ height: '100%', width: '100%', overflow: 'auto', backgroundColor: '#fff' }}>
                            {this.createPropertyTable()}
                        </div>
                    </Splitter>
                </div>
                <Modal
                    width={'1000px'}
                    title="Add resource"
                    visible={this.state.modalVisible}
                    onOk={this.handleModalOk}
                    onCancel={this.handleModalCancel}
                >
                    <ResourceSearchTrans onSelect={this.handleSelect}/>
                </Modal>
                {this.state.rightClickMenuVisible && this.renderRightMenu()}
            </div>
        );
    }
}
