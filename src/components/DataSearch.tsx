import * as React from "react";
import {Ecore} from "ecore";
import {API} from "../modules/api";
import Button from "antd/es/button";
import Form from "antd/es/form";
import Input from "antd/es/input";
import FormItem from "antd/es/form/FormItem";
import {Select} from "antd";
import {FormComponentProps} from 'antd/lib/form/Form';
import Checkbox from "antd/lib/checkbox";

interface Props {
    onSearch: (resources: Ecore.Resource[])=>void;
}

interface State {
    classes: Ecore.EObject[]
}

class DataSearch extends React.Component<Props & FormComponentProps, State> {
        state = {classes: []
    };

    handleSubmit = (e:any) => {
        e.preventDefault();
        this.props.form.validateFields((err:any, values:any) => {
            if (!err) {
                let selectedClassObject:Ecore.EObject|undefined = this.state.classes.find((c:Ecore.EObject) => c.get('name') === values.selectEClass);
                values.regular_expression
                    ?
                    (selectedClassObject && API.instance().findByKindAndRegexp(selectedClassObject as Ecore.EClass, values.name)
                            .then((resources) =>{
                                this.props.onSearch(resources)
                            }))
                    :
                    (selectedClassObject && API.instance().findByKindAndName(selectedClassObject as Ecore.EClass, values.name)
                            .then((resources) =>{
                                this.props.onSearch(resources)
                            }))}
        });

    };

    getEClasses(): void {
        API.instance().fetchAllClasses(false).then(classes=>{
            const filtered = classes.filter((c: Ecore.EObject) => !c.get('interface'));
            this.setState({ classes: filtered })
        })
    }

    componentDidMount(): void {
        this.getEClasses()
    }

    render() {
        const {Option} = Select;
        const {getFieldDecorator, getFieldValue} = this.props.form;
        return (
            <Form onSubmit={this.handleSubmit}>
                <FormItem>
                    {getFieldDecorator('selectEClass', {
                        rules: [{
                            required: true,
                            message: 'Please select eClass'
                        }],
                    })(
                        <Select
                            style={{width: '270px'}}
                            autoFocus>
                            {this.state.classes.map((c: Ecore.EObject, i: Number) =>
                                <Option value={c.get('name')} key={`${i}${c.get('name')}`}>
                                    {`${c.eContainer.get('name')}: ${c.get('name')}`}
                                </Option>)}
                        </Select>
                    )}
                </FormItem>
                <FormItem style={{display: 'inline-block'}}>
                            {getFieldDecorator('name', {
                                rules: [{
                                    required: getFieldValue('regular_expression'),
                                    message: 'Please enter name'
                                }]})(
                            <Input placeholder="name" style={{width: '270px'}} type="text" />
                            )}
                </FormItem>
                <FormItem style={{display: 'inline-block'}}>
                            {getFieldDecorator('regular_expression', {
                                valuePropName: 'checked'
                            })(
                                <Checkbox style={{marginLeft: '10px'}}>Regular expression</Checkbox>
                            )}
                </FormItem>
                <FormItem>
                    <Button type="primary" htmlType="submit">Search</Button>
                </FormItem>
            </Form>
        );
    }
}


export const WrappedDataSearch = Form.create<Props & FormComponentProps>()(DataSearch);