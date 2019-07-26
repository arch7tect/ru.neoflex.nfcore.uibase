import * as React from "react";
import {Col, Row, Table} from 'antd';
import {Ecore} from "ecore";
import {API} from "../modules/api";
import {Link} from "react-router-dom";
import forEach from "lodash/forEach"
import {DataSearch} from "./DataSearch";

export interface Props {
}

interface State {
    resources: Ecore.Resource[],
    columns: Array<any>,
    tableData: Array<any>
}

export class DataBrowser extends React.Component<any, State> {
    state = {
        resources: [], 
        columns: [],
        tableData: []
    };

    handleSearch = (resources : Ecore.Resource[]) => {
            const tableData:Array<any> = this.prepareTableData(resources);
            const columns:Array<any> = resources.length > 0 ? Object.keys(resources[0].to()).map((attr)=> ({title: attr, dataIndex: attr, key: attr})) : [];
            this.setState({ resources: resources, tableData: tableData, columns: columns})
    };

    prepareTableData(resources:Ecore.Resource[]):Array<any>{
        const prepared:Array<any> = [];
        resources.forEach((res:Ecore.Resource) => {
            prepared.push({...res.to(), resource: res})
        });
        prepared.map((res:any, idx) => {
            res["key"] = idx;
            forEach(res, (val,key)=>{
                if(typeof val === "object" && key !== "resource") {
                    res[key] = JSON.stringify(val)
                }
            });
            return res
        });
        return prepared
    }

    handleDeleteResource = (event:any, record:any) => {
        const ref:string = `${record.resource.get('uri')}?ref=${record.resource.rev}`;
        ref && API.instance().deleteResource(ref).then((response) => {
            if(response.result === "ok") this.handleSearch(event)
        });
        event.preventDefault()
    };

    render() {
        const columns:Array<any> = this.state.columns;

        const actionColumnDef = [{
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            fixed: 'right',
            width: 100,
            render: (text:string, record:any) => {
                const editButton = <Link key={`edit${record.key}`} to={`/settings/data/${record.resource.get('uri')}/${record.resource.rev}`}>
                    <span id="edit">Edit</span>
                </Link>;
                const deleteButton = <span id="delete" key={`delete${record.key}`} style={{ marginLeft: 8 }} onClick={(e:any)=>this.handleDeleteResource(e, record)}>Delete</span>;
                return [editButton, deleteButton]
            }
        }];

        return (
            <Row>
                <Col span={24}>
                        <div className="view-box">
                            <DataSearch onSearch={this.handleSearch}/>
                            {this.state.resources.length > 0 && <Table
                                scroll={{x: 1300}}
                                columns={columns.concat(actionColumnDef)}
                                dataSource={this.state.tableData}
                            />}
                        </div>
                </Col>
            </Row>
        );
    }
}