import * as React from "react";
import {Button, Col, Form, Icon, Input, Row, Table} from 'antd';
import Ecore from "ecore";
import {API} from "../modules/api";
import {Link} from "react-router-dom";
import forEach from "lodash/forEach"
import {WrappedDataSearch} from "./DataSearch";

export interface Props {
}

interface State {
    resources: Ecore.Resource[];
    columns: Array<any>;
    tableData: Array<any>;
    notFoundActivator: boolean;
    result: string;
    searchText: string;
}

export class DataBrowser extends React.Component<any, State> {
    state = {
        resources: [], 
        columns: [],
        tableData: [],
        notFoundActivator: false,
        result: '',
        searchText: ""
    };

    handleSearch = (resources : Ecore.Resource[]): void => {
        const tableData:Array<any> = this.prepareTableData(resources);
        const columns:Array<Ecore.EStructuralFeature> = resources.length > 0 ? this.prepareColumns(resources): [];
        this.setState({ resources: resources, tableData: tableData, columns: columns});
        this.setState({notFoundActivator: true});
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
        const AllColumns:Array<any> = [{title: 'eClass', dataIndex: 'eClass', key: 'eClass', type: 'stringType',
            sorter: (a: any, b: any) => this.sortColumns(a, b, 'eClass', 'stringType'),
            // ...this.getColumnSearchProps('eClass')
            filters: this.filterColumns('eClass'),
            onFilter: (value: any, record: any) => record.eClass.toLowerCase() === value.toLowerCase()

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
                // filters: this.filterColumns(name),
                // onFilter: (value: any, record: any) => record.name.toLowerCase() === value.toLowerCase(),
            })
        }
        return AllColumns;
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

    filterColumns = (name: string): Array<any> => {
        const result: Array<any> = [];
        for (let td of this.state.tableData){
            if (td[name] !== undefined && result.every((value) => value.text !== td[name])) {
                result.push({ text: td[name], value: td[name] })
            }
        }
        return result.sort((a: any, b: any) => this.sortColumns(a, b, "text", "stringType"));
    };

    sortColumns = (a: any, b: any, name: string, type: string): number => {
        if (b !== undefined) {
            if (type === "stringType") {
                if (a[name] !== undefined && b[name] !== undefined) {
                    if (a[name].toLowerCase() < b[name].toLowerCase()) { return -1; }
                    else if(a[name].toLowerCase() > b[name].toLowerCase()) { return 1; }
                    else {return 0}
                }
                else if (a[name] === undefined && b[name] !== undefined) {return -1}
                else if (a[name] !== undefined && b[name] === undefined) {return 1}
                else {return 0}
            }
            else if (type === "numberType") {
                if (a[name] !== undefined && b[name] !== undefined) {
                    return a[name] - b[name]
                } else if (a[name] === undefined && b[name] !== undefined) {
                    return 0 - b[name]
                } else if (a[name] !== undefined && b[name] === undefined) {
                    return a[name] - 0
                } else {return 0}
            }
            else if (type === "dateType") {return 0}
            else {return 0}
        } else {return 0}

    };

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

    handleDeleteResource = (event:any, record:any) => {
        const ref:string = `${record.resource.get('uri')}?ref=${record.resource.rev}`;
        ref && API.instance().deleteResource(ref).then((response) => {
            if(response.result === "ok") this.handleSearch(event)
        });
        event.preventDefault()
    };

    //for FilterMenu
    getColumnSearchProps = (name: any) => ({
        filterDropdown: (props: {
            setSelectedKeys: (selectedKeys: string[]) => void,
            selectedKeys: string[],
            confirm: () => void,
            clearFilters: () => void,
            // filters: ColumnFilterItem[],
        }) => (
            <Form style={{ padding: 8 }}>
                <Input
                    placeholder={`Search ${name}`}
                    value={props.selectedKeys[0]}
                    onChange={e =>
                        props.setSelectedKeys(e.target.value ? [e.target.value] : [])
                    }
                    onPressEnter={() => this.handleSearchFilterDropdown(props.selectedKeys, props.confirm)}
                    style={{ width: 188, marginBottom: 8, display: "block" }}
                    defaultChecked={true}
                />
                <Table
                />
                <Button
                    type="primary"
                    onClick={() => this.handleSearchFilterDropdown(props.selectedKeys, props.confirm)}
                    icon="search"
                    size="small"
                    style={{ width: 90, marginRight: 8 }}
                />
                <Button
                    onClick={() => this.handleResetFilterDropdown(props.clearFilters)}
                    size="small"
                    style={{ width: 90 }}
                    icon="rest"
                />
            </Form>
        ),

        filterIcon: (filtered: any) => (
            <Icon type="search" style={{ color: filtered ? "#1890ff" : undefined }} />
        ),

        onFilter: (value: string, record: string) =>
            record[name] !== undefined ? record[name].toLowerCase().includes(value.toLowerCase()) : false

    });

    handleSearchFilterDropdown = (selectedKeys: string[], confirm: () => void) => {
        confirm();
        this.setState({ searchText: selectedKeys[0] });
    };

    handleResetFilterDropdown = (clearFilters: () => void) => {
        clearFilters();
        this.setState({ searchText: "" });
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
                <Col>
                    <div className="view-box">
                        <WrappedDataSearch onSearch={this.handleSearch}/>
                        {this.state.resources.length === 0
                            ?
                            !this.state.notFoundActivator ? '' : 'Not found'
                            :
                            <Table
                                scroll={{x: 1300}}
                                columns={columns.concat(actionColumnDef)}
                                dataSource={this.state.tableData}
                            />}
                    </div>
                </Col>
            </Row>
        );
    }}