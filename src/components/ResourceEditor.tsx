import * as React from "react";
import { Row, Col, Tree, Icon } from 'antd';
import { Ecore } from "ecore";
//import { API } from "../modules/resource";
import SplitPane from 'react-split-pane';
//import Pane from 'react-split-pane/lib/Pane';

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
            <React.Fragment>
                <Row>
                    <Col span={24}>
                        <SplitPane
                            split="horizontal"
                            primary="first"
                            //size={ localStorage.getItem('splitPos') }
                            //onChange={ (size:any) => {
                                //localStorage.setItem('splitPos', size)
                            //}}>
                        >
                            <div style={{ height: '100%', width: '100%', overflow: 'auto' }}>
                                {this.createTree()}
                            </div>
                            <div
                                style={{ height: '100%', width: '100%', overflow: 'auto' }}
                            >
                                { <div>
                                    Yo,
                                </div> }
                            </div>
                        </SplitPane>
                        
                    </Col>

                </Row>
            </React.Fragment>
        );
    }
}