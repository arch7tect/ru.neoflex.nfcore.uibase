import * as React from "react";
import { Tree, Icon, Table } from 'antd';
import { Ecore } from "ecore";
import {API} from "../modules/api";
//import SplitPane from 'react-split-pane';
//import Pane from 'react-split-pane/lib/Pane';
import Splitter from 'm-react-splitters'

export interface Props {
}

interface State {
    resource: Ecore.EObject,
    ePackages: Ecore.EPackage[],
    selectedNodeName: string|undefined
}

export class ResourceEditor extends React.Component<any, State> {

    private splitterRef: React.RefObject<any>

    constructor(props: any) {
        super(props);
        this.splitterRef = React.createRef();
    }

    state = {
        resource: {} as Ecore.EObject,
        ePackages: [],
        selectedNodeName: undefined
    }

    getPackages(){
        API.instance().fetchPackages().then(packages=>{
            this.setState({ePackages: packages})
        })
    }

    getResource(): void {
        API.instance().fetchEObject(`${this.props.match.params.id}?ref=${this.props.match.params.ref}`).then(resource=>{
            this.setState({ resource })
        })
    }

    createPropertyTable() {
        return (
            <Table bordered 
                size="small"
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
            //dataSource={this.data} 
            />
        )
    }

    createTree() {
        return (
            <Tree
                showIcon
                defaultExpandAll
                switcherIcon={<Icon type="down" />}
                onSelect={(selectedKeys) => {
                    console.log(selectedKeys)
                    //res.eClass.get('eAllStructuralFeatures')
                }}
            >
                <Tree.TreeNode style={{fontWeight: '600'}} icon={<Icon type="cluster" />} title={this.state.resource.eClass.get('name')} key="0-0">
                    {this.state.resource.eContents().map((res,idx) => 
                        <Tree.TreeNode key={idx.toString()} icon={<Icon type="block"/>} title={res.eClass.get('name')} />)}
                </Tree.TreeNode>
                {/* <Tree.TreeNode icon={<Icon type="smile-o" />} title="parent 1" key="0-0">
                    <Tree.TreeNode icon={<Icon type="meh-o" />} title="leaf" key="0-0-0" />
                    <Tree.TreeNode
                        icon={({ selected }) => <Icon type={selected ? 'frown' : 'frown-o'} />}
                        title="leaf"
                        key="0-0-1"
                    />
                </Tree.TreeNode> */}
            </Tree>
        )
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
                            <div style={{ height: '100%', width: '100%', overflow: 'auto' }}>
                                {this.createPropertyTable()}
                            </div>
                        </Splitter>
                    </div>
                </div>
        );
    }
}