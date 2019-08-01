import * as React from "react";
import {Button, Form, Icon, Table} from 'antd';
import {Ecore} from "ecore";
import {API} from "../modules/api";
import {Link} from "react-router-dom";
import forEach from "lodash/forEach"
import {FormComponentProps} from "antd/lib/form";
import {WrappedDataSearch} from "./DataSearch";
import FormItem from "antd/es/form/FormItem";

interface Props {
    onSelect?: (resources: Ecore.Resource[]) => void;
    showAction?: boolean;
    specialEClass?: string;
}

interface State {
    resources: Ecore.Resource[];
    columns: Array<any>;
    tableData: Array<any>;
    notFoundActivator: boolean;
    result: string;
    selectedRowKeys: any[];
    loading: boolean;
}

class SearchGrid extends React.Component<Props & FormComponentProps, State> {
    state = {
        resources: [], 
        columns: [],
        tableData: [],
        notFoundActivator: false,
        result: '',
        selectedRowKeys: [],
        loading: false
    };

    handleSearch = (resources : Ecore.Resource[]): void => {
        this.setState({selectedRowKeys: []});
        this.setState({notFoundActivator: true});
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

    handleSelect = () => {
        if (this.props.onSelect) {
            this.props.onSelect(
                this.state.selectedRowKeys.map(i=>this.state.resources[i])
            );
        }
    };

    handleDeleteResource = (event:any, record:any) => {
        const ref:string = `${record.resource.get('uri')}?ref=${record.resource.rev}`;
        ref && API.instance().deleteResource(ref).then((response) => {
            if(response.result === "ok") this.handleSearch(event)
        });
        event.preventDefault()
    };

    onSelectChange = (selectedRowKeys: any) => {
        this.setState({ selectedRowKeys });
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
        const {selectedRowKeys} = this.state;
        const rowSelection = {
            selectedRowKeys,
            onChange: this.onSelectChange,
        };
        const hasSelected = selectedRowKeys.length > 0;

        return (
         <Form style={{padding: '20px'}}>
             <FormItem>
                 <WrappedDataSearch onSearch={this.handleSearch} specialEClass={this.props.specialEClass != '' ? this.props.specialEClass : ''}/>
             </FormItem>
             <FormItem>
                 {this.state.resources.length === 0
                     ?
                     !this.state.notFoundActivator ? '' : 'Not found'
                     :
                     this.props.onSelect != undefined
                         ?
                         <div>
                             <FormItem>
                                 <Button type="primary" onClick={this.handleSelect} disabled={!hasSelected} style={{width: '100px', fontSize: '17px'}}>
                                     <Icon type="select" />
                                </Button>
                             </FormItem>
                             <Table
                                 scroll={{x: 1300}}
                                 columns={this.props.showAction ? columns.concat(actionColumnDef) : columns}
                                 dataSource={this.state.tableData}
                                 rowSelection={rowSelection}
                             />
                         </div>
                         :
                         <Table
                             scroll={{x: 1300}}
                             columns={this.props.showAction ? columns.concat(actionColumnDef) : columns}
                             dataSource={this.state.tableData}
                         />
                 }
             </FormItem>
         </Form>
        );
    }}

export const WrappedSearchGrid = Form.create<Props & FormComponentProps>()(SearchGrid);