import * as React from "react";
import {Row, Col, Table} from 'antd';
import {Ecore} from "ecore";
import {API} from "../modules/api";
import {Link} from "react-router-dom";
//import debounce from "lodash/debounce"; 
//import update from "immutability-helper"
import forEach from "lodash/forEach"
//import cloneDeep from "lodash/cloneDeep"

export interface Props {
}

interface State {
    classes: Ecore.EObject[],
    searchName: String|undefined,
    selectedType: String,
    searchResult: Ecore.EObject[],
    resources: Ecore.Resource[],
    columns: Array<any>,
    tableData: Array<any>
}

export class DataBrowser extends React.Component<any, State> {
    state = {
        classes: [], 
        selectedType: "", 
        searchName: undefined,
        searchResult: [], 
        resources: [], 
        columns: [],
        tableData: []
    }

    getEClasses(): void {
        API.instance().fetchAllClasses(false).then(classes=>{
            const filtered = classes.filter((c: Ecore.EObject) => !c.get('interface'))
            this.setState({ classes: filtered })
        })
    }

    handleSearch = (event:any) => {
        let selectedClassObject:Ecore.EObject|undefined = this.state.classes.find((c:Ecore.EObject) => c.get('name') === this.state.selectedType);
        selectedClassObject && API.instance().findByKind(selectedClassObject as Ecore.EClass, this.state.searchName).then(resources =>{
            const tableData:Array<any> = this.prepareTableData(resources)
            const columns:Array<any> = resources.length > 0 ? Object.keys(resources[0].to()).map((attr)=> ({title: attr, dataIndex: attr, key: attr})) : []
            this.setState({ resources: resources, tableData: tableData, columns: columns})
        })
        event.preventDefault()
    }

    prepareTableData(resources:Ecore.Resource[]):Array<any>{
        const prepared:Array<any> = []
        resources.forEach((res:Ecore.Resource) => {
            prepared.push({...res.to(), resource: res})
        })
        prepared.map((res:any, idx) => {
            res["key"] = idx
            forEach(res, (val,key)=>{
                if(typeof val === "object" && key !== "resource") {
                    res[key] = JSON.stringify(val)
                }
            })
            return res
        })
        return prepared
    }

    
    handleSelect = (event: any) => {
        this.setState({ selectedType: event.currentTarget.value })
    }

    handleChangeSearchName = (event: any) =>{
        this.setState({ searchName: event.currentTarget.value })
    }

    handleEdit = (event:any, record:any) => {
        event.preventDefault()
    }

    handleDeleteResource = (event:any, record:any) => {
        const ref:string = `${record.resource.get('uri')}?ref=${record.resource.rev}`
        ref && API.instance().deleteResource(ref).then((response) => {
            if(response.result === "ok") this.handleSearch(event)
        })
        event.preventDefault()
    }

    componentDidMount(): void {
        this.getEClasses()
    }

    render() {
        const columns:Array<any> = this.state.columns

        const actionColumnDef = [{
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            fixed: 'right',
            width: 100,
            render: (text:string, record:any) => {
                const editButton = <Link key={`edit${record.key}`} to={`/data/${record.resource.get('uri')}/${record.resource.rev}`}>
                    <span id="edit">Edit</span>
                </Link>
                const deleteButton = <span id="delete" key={`delete${record.key}`} style={{ marginLeft: 8 }} onClick={(e:any)=>this.handleDeleteResource(e, record)}>Delete</span>
                return [editButton, deleteButton]
            }
        }]

        return (
            <Row>
                <Col span={24}>
                    <div>
                        <form>
                            <select autoFocus onChange={this.handleSelect} defaultValue={this.state.selectedType}>
                                <option key="---" value="">---</option>
                                {this.state.classes.map((c: Ecore.EObject, i: Number) =>
                                    <option value={c.get('name')} key={`${i}${c.get('name')}`}>{`${c.eContainer.get('name')}: ${c.get('name')}`}</option>)}
                            </select>
                            <input onChange={this.handleChangeSearchName} type="text" />
                            <button onClick={this.handleSearch}>Search</button>
                        </form>
                        {this.state.resources.length > 0 && <Table
                            scroll={{ x: 1300 }}
                            columns={columns.concat(actionColumnDef)}
                            dataSource={this.state.tableData}
                        />}
                    </div>
                </Col>
            </Row>
        );
    }
}