import * as React from "react";
import {Ecore} from "ecore";
import {API} from "../modules/api";
import Button from "antd/es/button";
import Form from "antd/es/form";
import Input from "antd/es/input";
import FormItem from "antd/es/form/FormItem";
import {Icon, Select, Tabs} from "antd";
import {FormComponentProps} from 'antd/lib/form/Form';
import Checkbox from "antd/lib/checkbox";
import AceEditor from "react-ace";
import 'brace/theme/tomorrow';

interface Props {
    onSearch: (resources: Ecore.Resource[]) => void;
    specialEClass?: string;
}

interface State {
    classes: Ecore.EObject[];
}

class DataSearch extends React.Component<Props & FormComponentProps, State> {
    state = {
        classes: []
    };

    handleSubmit = (e: any) => {
        e.preventDefault();
        this.props.form.validateFields((err: any, values: any) => {
            if (!err) {
                let selectedClassObject: Ecore.EObject | undefined = this.state.classes.find((c: Ecore.EObject) => c.get('name') === values.selectEClass);
                values.key === 'json_search'
                    ?
                    API.instance().find(JSON.parse(values.json_field)).then(results => {
                        this.props.onSearch(results.resources)
                    })
                    :
                    values.regular_expression
                        ?
                        (selectedClassObject && API.instance().findByKindAndRegexp(selectedClassObject as Ecore.EClass, values.name)
                            .then((resources) => {
                                this.props.onSearch(resources)
                            }))
                        :
                        (selectedClassObject && API.instance().findByKindAndName(selectedClassObject as Ecore.EClass, values.name)
                            .then((resources) => {
                                this.props.onSearch(resources)
                            }))}
        });
    };

    getEClasses(): void {
            API.instance().fetchAllClasses(false).then(classes => {
            const filtered = classes.filter((c: Ecore.EObject) => !c.get('interface'));
            this.setState({classes: filtered})
        })
    }

    componentDidMount(): void {
        this.getEClasses()
    }

    render() {
        const {Option} = Select;
        const {getFieldDecorator, getFieldValue, setFields} = this.props.form;
        const {TabPane} = Tabs;
        return (
            <Form onSubmit={this.handleSubmit}>
                {getFieldDecorator('key', {initialValue: 'data_search'})(
                    <Tabs onChange={(key: string) => {
                        setFields({key: {value: key}});
                    }}>
                        <TabPane tab='Data Search' key='data_search'>
                            <FormItem>
                                {getFieldDecorator('selectEClass', {
                                    initialValue: !!this.props.specialEClass ? this.props.specialEClass : undefined,
                                    rules: [{
                                        required: getFieldValue('key') === 'data_search',
                                        message: 'Please select eClass',
                                    }],
                                })(
                                    <Select
                                        disabled={!!this.props.specialEClass}
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
                                        required: getFieldValue('regular_expression') && getFieldValue('key') === 'data_search',
                                        message: 'Please enter name'
                                    }]
                                })(
                                    <Input placeholder="name" style={{width: '270px'}} type="text"/>
                                )}
                            </FormItem>
                            <FormItem style={{display: 'inline-block'}}>
                                {getFieldDecorator('regular_expression', {
                                    valuePropName: 'checked'
                                })(
                                    <Checkbox style={{marginLeft: '10px'}}>Regular expression</Checkbox>
                                )}
                            </FormItem>
                        </TabPane>
                        <TabPane tab='Json Search' key='json_search'>
                            <Form.Item>
                                {getFieldDecorator('json_field', {
                                    initialValue: JSON.stringify({
                                    contents: {eClass: "ru.neoflex.nfcore.base.auth#//" + (this.props.specialEClass || "User")}}, null, 4),
                                    rules: [{
                                        required: getFieldValue('key') === 'json_search',
                                        message: 'Please enter json'
                                    }]
                                })(
                                    <div>
                                    <AceEditor
                                        readOnly={!!this.props.specialEClass}
                                        ref={"aceEditor"}
                                        mode={"json"}
                                        width={"100%"}
                                        onChange={(json_field: string) => {
                                            setFields({json_field: {value: json_field}});
                                        }}
                                        editorProps={{$blockScrolling: true}}
                                        value={getFieldValue('json_field')}
                                        showPrintMargin={false}
                                        theme={"tomorrow"}
                                        debounceChangePeriod={100}
                                        height={"104px"}
                                    />
                                    </div>
                                    )}
                              </Form.Item>
                        </TabPane>
                    </Tabs>
                )}
                <FormItem>
                    <Button type="primary" htmlType="submit" style={{width: '100px', fontSize: '17px'}}>
                        <Icon type="search" />
                    </Button>
                </FormItem>
            </Form>
        );
    }
}

export const WrappedDataSearch = Form.create<Props & FormComponentProps>()(DataSearch);