import * as React from "react";
import {Button, Col, Icon, Modal, Row, Select, Table, Tree} from 'antd';
import Ecore, {EObject} from "ecore";
import {API} from "../modules/api";
import Splitter from './CustomSplitter'
import update from 'immutability-helper';
//import { any } from "prop-types";
//import _filter from 'lodash/filter'
//import _map from 'lodash/map'
import EditableTextArea from './EditableTextArea'
import {WrappedSearchGrid} from "./SearchGrid";

interface ITargetObject {
    [key: string]: any;
}

export interface Props {
}

interface State {
    resource: Ecore.EObject,
    resourceJSON: Object,
    ePackages: Ecore.EPackage[],
    selectedNodeName: string | undefined,
    tableData: Array<any>,
    targetObject: Object,
    selectedKey: String,
    modalVisible: Boolean,
    rightClickMenuVisible: Boolean,
    rightMenuPosition: Object 
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
        rightMenuPosition: {x:100,y:100}
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
     * Creates updaters for all levels of object, including for objects in arrays.
     */
    nestUpdaters(json: any, parentObject: any = null, property?: String): Object {

        const createUpdater = (data: Object, init_idx?: Number) => {
            return function updater(newValues: Object, indexForParentUpdater?: any, targetArray?: any) {
                const currentObject = data;
                const idx: any = init_idx;
                const prop: any = property;
                const parent = parentObject;
                let updatedData;
                if (targetArray) {
                    updatedData = update(currentObject as any, { [targetArray]: { [indexForParentUpdater]: { $merge: newValues } } })
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
                if (Array.isArray(value)) this.nestUpdaters(value, obj, key)
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

        const walkThroughObject = (obj: Object): any => {
            let result;
            Object.entries(obj).forEach(([key, value]) => {
                if (Array.isArray(value)) result = this.findObjectById(value, id)
            });
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

        function generateNodes(resource: Ecore.EObject): Array<any> {
            return resource.eContents().map((res, idx) =>
                <Tree.TreeNode key={res._id} eClass={res} icon={<Icon type="block" />} title={res.eClass.get('name')}>
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
                onRightClick={this.onRightClick}
            >
                <Tree.TreeNode style={{ fontWeight: '600' }} icon={<Icon type="cluster" />} title={this.state.resource.eClass.get('name')} key={this.state.resource._id}>
                    {generateNodes(this.state.resource)}
                </Tree.TreeNode>
            </Tree>
        )
    }

    onTreeSelect = (selectedKeys: Array<String>, e: any) => {
        if (selectedKeys[0]) {
            const targetObject = this.findObjectById(this.state.resourceJSON, selectedKeys[0]);
            this.setState({
                tableData: this.prepareTableData(targetObject, this.state.resource),
                targetObject: targetObject,
                selectedKey: selectedKeys[0]
            })
        }
    };

    onRightClick = (e:any) => {
        this.setState({ rightClickMenuVisible: true, rightMenuPosition: { x: e.event.clientX, y: e.event.clientY } })
    };

    prepareTableData(targetObject: ITargetObject, resource: EObject): Array<any> {

        const boolSelectionOption: { [key: string]: any } = { "null": null, "true": true, "false": false }
        const getPrimitiveType = (value:string):any => boolSelectionOption[value]
        const convertPrimitiveToString = (value:string):any => String(boolSelectionOption[value])

        const prepareValue = (eObject: Ecore.EObject, value: any, idx:Number): any => {
            if (eObject.isKindOf('EReference')) {
                const elements = value ? value.map((el: Object, idx: number) => <React.Fragment key={idx}>{JSON.stringify(el)}<br /></React.Fragment>) : []
                const component = <React.Fragment key={eObject.get('name')+"_"+targetObject.id}>
                    {elements}
                    <Button key={eObject.get('name')+"_"+targetObject.id} onClick={()=>this.setState({ modalVisible: true })}>...</Button>
                </React.Fragment>
                return component
            } else if (eObject.get('eType').isKindOf('EDataType') && eObject.get('eType').get('name') === "EBoolean") {
                return <Select value={convertPrimitiveToString(value)} key={eObject.get('name')+"_bool_"+targetObject.id} style={{ width: "300px" }} onChange={(newValue: any) => {
                        const updatedJSON = targetObject.updater({ [eObject.get('name')]: getPrimitiveType(newValue) });
                        const nestedJSON = this.nestUpdaters(updatedJSON, null);
                        const object = this.findObjectById(nestedJSON, targetObject._id);
                        const preparedData = this.prepareTableData(object, this.state.resource);
                        this.setState({ resourceJSON: nestedJSON, tableData: preparedData })
                    }}>
                        {Object.keys(boolSelectionOption).map((value:any)=>
                            <Select.Option key={eObject.get('name')+"_opt_"+value+"_"+targetObject.id} value={value}>{value}</Select.Option>)}
                </Select>
            } else if (eObject.get('eType').isKindOf('EEnum')){
                return <Select value={value} key={eObject.get('name')+"_enum_"+targetObject.id} style={{ width: "300px" }} onChange={(newValue: any) => {
                    const updatedJSON = targetObject.updater({ [eObject.get('name')]: newValue });
                    const nestedJSON = this.nestUpdaters(updatedJSON, null);
                    const object = this.findObjectById(nestedJSON, targetObject._id);
                    const preparedData = this.prepareTableData(object, this.state.resource);
                    this.setState({ resourceJSON: nestedJSON, tableData: preparedData })
                }}>
                    {eObject.get('eType').eContents().map((obj:EObject)=>
                        <Select.Option key={eObject.get('name')+"_opt_"+obj.get('name')+"_"+targetObject.id} value={obj.get('name')}>{obj.get('name')}</Select.Option>)}
                </Select>
            } else {
                return <EditableTextArea
                    key={eObject.get('name')+"_textarea"}
                    editedProperty={eObject.get('name')}
                    value={value}
                    onChange={(newValue: Object) => {
                        const updatedJSON = targetObject.updater(newValue);
                        const nestedJSON = this.nestUpdaters(updatedJSON, null);
                        const object = this.findObjectById(nestedJSON, targetObject._id);
                        const preparedData = this.prepareTableData(object, this.state.resource);
                        this.setState({ resourceJSON: nestedJSON, tableData: preparedData })
                    }}
                />
            }
        };

        const preparedData:Array<Object> = [];
        const featureList = resource.eContainer.getEObject(targetObject._id).eClass.get('eAllStructuralFeatures')
        featureList.forEach((feature: Ecore.EObject, idx: Number) => {
            const isContainment = Boolean(feature.get('containment'));
            if(!isContainment) preparedData.push({ 
                property: feature.get('name'), 
                value: prepareValue(feature, targetObject[feature.get('name')], idx), 
                key: feature.get('name') + idx })
        });

        return preparedData
    }

    handleModalOk = () => {
        this.setState({ modalVisible: false })
    };

    handleModalCancel = () => {
        this.setState({ modalVisible: false })
    };

    hideRightClickMenu = () =>{
        this.setState({ rightClickMenuVisible: false })
    };

    handleSelect = (resources : Ecore.Resource[]): void => {
        this.setState({ modalVisible: false })
    };

    componentWillUnmount() {
        window.removeEventListener("click", this.hideRightClickMenu)
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        
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
                    destroyOnClose={true}
                    maskClosable={true}
                    visible={this.state.modalVisible}
                    onCancel={this.handleModalCancel}
                    footer={false}
                >
                    <WrappedSearchGrid onSelect={this.handleSelect} showAction={false} specialEClass={undefined}/>
                </Modal>
                {this.state.rightClickMenuVisible && <div className="right-menu" style={{
                    position: "absolute",
                    display: "inline-block",
                    boxShadow: "2px 2px 8px -1px #cacaca",
                    borderRadius: "4px",
                    height: "100px",
                    width: "100px",
                    left: this.state.rightMenuPosition.x,
                    top: this.state.rightMenuPosition.y,
                    backgroundColor: "#fff",
                    padding: "7px"
                }}>Pavel</div>}
            </div>
        );
    }
}