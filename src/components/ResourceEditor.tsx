import * as React from "react";
import { Row, Col, Tree, Icon } from 'antd';
import { Ecore } from "ecore";
//import { API } from "../modules/resource";
//import SplitPane from 'react-split-pane';
//import Pane from 'react-split-pane/lib/Pane';
import Splitter from 'm-react-splitters'

export interface Props {
}

interface State {
    classes: Ecore.EObject[],
    searchName: String | undefined,
    selectedType: String,
    searchResult: Ecore.EObject[],
    resources: Ecore.Resource[],
    columns: Array<any>,
    tableData: Array<any>
}

export class ResourceEditor extends React.Component<any, State> {

    private splitterRef: React.RefObject<any>

    constructor(props: any) {
        super(props);
        this.splitterRef = React.createRef();
    }

    state = {
        classes: [],
        selectedType: "",
        searchName: undefined,
        searchResult: [],
        resources: [],
        columns: [],
        tableData: []
    }

    createTree() {
        return (
            <Tree
                showIcon
                defaultExpandAll
                defaultSelectedKeys={['0-0-0']}
                switcherIcon={<Icon type="down" />}
            >
                <Tree.TreeNode icon={<Icon type="smile-o" />} title="parent 1" key="0-0">
                    <Tree.TreeNode icon={<Icon type="meh-o" />} title="leaf" key="0-0-0" />
                    <Tree.TreeNode
                        icon={({ selected }) => <Icon type={selected ? 'frown' : 'frown-o'} />}
                        title="leaf"
                        key="0-0-1"
                    />
                </Tree.TreeNode>
            </Tree>
        )
    }

    componentDidMount(): void {

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
                            <div style={{ height: '100%', width: '100%', overflow: 'auto' }}>
                                {this.createTree()}
                            </div>
                            <div
                                style={{ height: '100%', width: '100%', overflow: 'auto' }}
                            >
                            test
                            </div>
                        </Splitter>
                    </div>
                </div>
        );
    }
}