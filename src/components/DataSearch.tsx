import * as React from "react";
import {Ecore} from "ecore";
import {API} from "../modules/api";
import Button from "antd/es/button";
import Form from "antd/es/form";
import Input from "antd/es/input";
import FormItem from "antd/es/form/FormItem";
import {Select} from "antd";

export interface Props {
    onSearch: (resources: Ecore.Resource[])=>void;
}

interface State {
    classes: Ecore.EObject[],
    searchName: String|undefined,
    selectedType: String
}

export class DataSearch extends React.Component<Props, State> {
    state = {
        classes: [], 
        selectedType: "",
        searchName: undefined
    };

    getEClasses(): void {
        API.instance().fetchAllClasses(false).then(classes=>{
            const filtered = classes.filter((c: Ecore.EObject) => !c.get('interface'));
            this.setState({ classes: filtered })
        })
    }

    handleSearch = () => {
        let selectedClassObject:Ecore.EObject|undefined = this.state.classes.find((c:Ecore.EObject) => c.get('name') === this.state.selectedType);
        selectedClassObject && API.instance().findByKind(selectedClassObject as Ecore.EClass, this.state.searchName)
            .then((resources) =>{
                this.props.onSearch(resources)
            })
    };

    handleSelect = (value: any) => {
        this.setState({ selectedType: value })
    };

    handleChangeSearchName = (event: any) =>{
        this.setState({ searchName: event.currentTarget.value })
    };

    handleEdit = (event:any, record:any) => {
        event.preventDefault()
    };

    componentDidMount(): void {
        this.getEClasses()
    }

    //getFieldDecorator
    //validation
    render() {
        const { Option } = Select;
        // const { getFieldDecorator } = this.props.form;
        return (
            <Form layout="horizontal" >
                <FormItem>
                    <Select
                        style={{width: '250px'}}
                        autoFocus
                        onChange={this.handleSelect}
                        defaultValue={this.state.selectedType}>
                        <Option key="---" value="">---</Option>
                        {this.state.classes.map((c: Ecore.EObject, i: Number) =>
                            <Option value={c.get('name')} key={`${i}${c.get('name')}`}>
                                {`${c.eContainer.get('name')}: ${c.get('name')}`}
                            </Option>)}
                    </Select>
                </FormItem>
                <FormItem>
                    <Input style={{width: '250px'}} onChange={this.handleChangeSearchName} type="text" />
                </FormItem>
                <FormItem>
                    <Button onClick={this.handleSearch}>Search</Button>
                </FormItem>
            </Form>
        );
    }
}