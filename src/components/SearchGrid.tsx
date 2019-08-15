import * as React from "react";
import {Button, Form, Icon, Table} from 'antd';
import Ecore from "ecore";
import {API} from "../modules/api";
import {Link} from "react-router-dom";
import forEach from "lodash/forEach"
import {FormComponentProps} from "antd/lib/form";
import {WrappedDataSearch} from "./DataSearch";
import FormItem from "antd/es/form/FormItem";
import {WrappedSearchFilter} from "./SearchFilter";

interface Props {
    onSelect?: (resources: Ecore.Resource[]) => void;
    showAction?: boolean;
    specialEClass?: Ecore.EClass | undefined;
}

interface State {
    resources: Ecore.Resource[];
    columns: Array<any>;
    tableData: Array<any>;
    tableDataFilter: Array<any>;
    notFoundActivator: boolean;
    result: string;
    selectedRowKeys: any[];
}

class SearchGrid extends React.Component<Props & FormComponentProps, State> {

    state = {
        resources: [],
        columns: [],
        tableData: [],
        tableDataFilter: [],
        notFoundActivator: false,
        result: '',
        selectedRowKeys: []
    };

    handleSearch = (resources : Ecore.Resource[]): void => {
        this.setState({selectedRowKeys: []});
        const tableData:Array<any> = this.prepareTableData(resources);
        this.setState({ tableData: tableData });
        const columns:Array<Ecore.EStructuralFeature> = resources.length > 0 ? this.prepareColumns(resources): [];
        this.setState({ resources: resources, columns: columns});
        this.setState({notFoundActivator: true});
        this.setState({tableDataFilter: []});
    };

    prepareColumns(resources:Ecore.Resource[]):Array<Ecore.EStructuralFeature>{
        const AllFeatures:Array<Ecore.EStructuralFeature> = [];
        resources.forEach((res:Ecore.Resource) => {
            const attrs:Array<Ecore.EStructuralFeature> = res.get('contents').first().eClass.get('eAllStructuralFeatures');
            for (let attr of attrs){
                if (AllFeatures.every((value)=>value.get('name') !== attr.get('name'))) {
                    AllFeatures.push(attr);
                }
            }
        });


        let name: string = 'eClass';
        let type: string = 'stringType';
        let AllColumns:Array<any> = [{title: name, dataIndex: name, key: name, type: name,
            sorter: (a: any, b: any) => this.sortColumns(a, b, name, type),
            filters: this.filterColumns(name),
            filterIcon: (filtered: any) => (
                <Icon type="search" style={{ color: filtered ? "#1890ff" : undefined }} />
            ),
            onFilter: (value: any, record: any) => record.eClass.toLowerCase() === value.toLowerCase(),
        }];


        for (let column of AllFeatures){
            let name: string = "";
            column.get('name') === "children" ? name = "_children" : name = column.get('name');
            const type: string = !!column.get('eType') && column.get('eType').eClass.get('name') === 'EDataType' ? this.getDataType(column.get('eType').get('name')) : "stringType";
            AllColumns.push({title: name, dataIndex: name, key: name, type: type,
                sorter: (a: any, b: any) => this.sortColumns(a, b, name, type),
                render: (text: any) => {
                if (text !== undefined && column.get('eType').eClass.get('name') !== 'EDataType') {
                        const maxJsonLength = text.indexOf('#') + 1;
                        return text.slice(0, maxJsonLength) + "..." }
                else {return text}},
                ...this.getColumnSearchProps(name),
                filterIcon: (filtered: any) => (
                    <Icon type="search" style={{ color: filtered ? "#1890ff" : undefined }} />
                ),
                onFilter: (value: any, record: any) => record.name !== undefined ?
                    record.name.toString().toLowerCase() === value.toString().toLowerCase() : undefined
            })
        }
        return AllColumns;
    }

    prepareTableData(resources:Ecore.Resource[]): Array<Ecore.EStructuralFeature>{
        const prepared: Array<Ecore.EStructuralFeature> = [];
        resources.forEach((res: Ecore.Resource) => {
            if (res.to().length === undefined) {
                const row = {...res.to(), resource: res};
                if (row.hasOwnProperty("children")) {
                    row["_children"] = row["children"];
                    delete row["children"]
                }
                prepared.push(row);
            }
        });
        prepared.map((res:any, idx) => {
            res["key"] = idx;
            forEach(res, (val,key)=>{
                if (typeof val === "object" && key !== "resource") {
                    res[key] = JSON.stringify(val)
                }
            });
            return res
        });
        return prepared
    }

    getDataType = (type: string): string => {
        const stringType: Array<string> = ["Timestamp", "ByteArray", "Password", "Text", "URL", "QName", "EString", "EBoolean", "EMap", "EDiagnosticChain", "JSObject"];
        const numberType: Array<string> = ["EInt", "EDouble", "EIntegerObject", "EFloatObject", "ELongObject", "EShort", "EFloat", "ELong", "EDoubleObject"];
        const dateType: Array<string> = ["Date", "EDate"];
        if (stringType.includes(type)) return "stringType";
        else if (numberType.includes(type)) return "numberType";
        else if (dateType.includes(type)) return "dateType";
        else return "hi, i don`t know this type"
    };

    sortColumns = (a: any, b: any, name: string, type: string): number => {
        if (b !== undefined) {
            if (type === "stringType") {
                if (a[name] !== undefined && b[name] !== undefined) {
                    if (a[name].toLowerCase() < b[name].toLowerCase()) return -1;
                    else if(a[name].toLowerCase() > b[name].toLowerCase()) return 1;
                    else return 0;
                }
                else if (a[name] === undefined && b[name] !== undefined) return -1;
                else if (a[name] !== undefined && b[name] === undefined) return 1;
                else return 0;
            }
            else if (type === "numberType") {
                if (a[name] !== undefined && b[name] !== undefined) { return a[name] - b[name] }
                else if (a[name] === undefined && b[name] !== undefined) return -1;
                else if (a[name] !== undefined && b[name] === undefined) return 1;
                else return 0;
            }
            else if (type === "dateType") return 0;
            else return 0;
        } else return 0;
    };

    filterColumns = (name: string): Array<any> => {
        const result: Array<any> = [];
        const tableData: Array<any> = this.state.tableDataFilter.length === 0 ?
                this.state.tableData : this.state.tableDataFilter;
        for (let td of tableData){
            if (td[name] !== undefined && result.every((value) => value.text !== td[name])) {
                result.push({ text: td[name], value: td[name] })
            }
        }
        return result.sort((a: any, b: any) => this.sortColumns(a, b, "text", "stringType"));
    };

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

    //for FilterMenu
    getColumnSearchProps = (name: any) => ({
        filterDropdown: () =>
                <WrappedSearchFilter onName={name} tableData={this.state.tableData}
                                     tableDataFilter={this.changeTableData}/>
    });

    changeTableData = (tableDataFilter: Array<any>) => {
        this.setState({tableDataFilter})
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
                onChange: this.onSelectChange
            };
            const hasSelected = selectedRowKeys.length > 0;
            return (
             <Form style={{padding: '20px'}}>
                 <FormItem>
                     <WrappedDataSearch onSearch={this.handleSearch}
                                        specialEClass={this.props.specialEClass !== undefined ? this.props.specialEClass : undefined}
                     />
                 </FormItem>
                 <FormItem>
                     {this.state.resources.length === 0
                         ?
                         !this.state.notFoundActivator ? '' : 'Not found'
                         :
                         this.props.onSelect !== undefined
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
                                     dataSource={this.state.tableDataFilter.length === 0 ?
                                         this.state.tableData : this.state.tableDataFilter}
                                     bordered={true}
                                     rowSelection={rowSelection}
                                     style={{whiteSpace: "pre"}}
                                 />
                             </div>
                             :
                             <Table
                                 scroll={{x: 1300}}
                                 columns={this.props.showAction ? columns.concat(actionColumnDef) : columns}
                                 dataSource={this.state.tableDataFilter.length === 0 ?
                                     this.state.tableData : this.state.tableDataFilter}
                                 bordered={true}
                                 style={{whiteSpace: "pre"}}
                             />
                     }
                 </FormItem>
             </Form>
            );
        }}

    export const WrappedSearchGrid = Form.create<Props & FormComponentProps>()(SearchGrid);