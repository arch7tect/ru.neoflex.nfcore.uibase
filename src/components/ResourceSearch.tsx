import * as React from "react";
import {Button, Table} from 'antd';
import Ecore from "ecore";
import forEach from "lodash/forEach"
import DataSearchTrans from "./DataSearch";
import Form from "antd/es/form";
import {FormComponentProps} from 'antd/lib/form/Form';
import 'brace/theme/tomorrow';
import {withTranslation, WithTranslation} from "react-i18next";

interface Props {
    onSelect: (resources: Ecore.Resource[]) => void;
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

class ResourceSearch extends React.Component<Props & FormComponentProps & WithTranslation, State> {
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
        this.props.onSelect(
            this.state.selectedRowKeys.map(i=>this.state.resources[i])
        );
    };

    onSelectChange = (selectedRowKeys: any) => {
        this.setState({ selectedRowKeys });
    };

    render() {
        const {selectedRowKeys} = this.state;
        const rowSelection = {
            selectedRowKeys,
            onChange: this.onSelectChange,
        };
        const hasSelected = selectedRowKeys.length > 0;
        return (
            <div className="view-box">
                <DataSearchTrans onSearch={this.handleSearch}/>
                {this.state.resources.length === 0
                    ?
                    !this.state.notFoundActivator ? '' : 'Not found'
                    :
                    <div>
                        <Table
                            scroll={{x: 1300}}
                            columns={this.state.columns}
                            dataSource={this.state.tableData}
                            rowSelection={rowSelection}
                        />
                        <Button type="primary" onClick={this.handleSelect} disabled={!hasSelected}>
                            Select
                        </Button>
                    </div>
                }
            </div>
        );
    }}

const WrappedResourceSearch = Form.create<Props & FormComponentProps & WithTranslation>()(ResourceSearch);
const ResourceSearchTrans = withTranslation()(WrappedResourceSearch);
export default ResourceSearchTrans;

