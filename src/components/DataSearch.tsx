import * as React from "react";
import Ecore from "ecore";
import {API} from "../modules/api";
import Button from "antd/es/button";
import Form from "antd/es/form";
import Input from "antd/es/input";
import FormItem from "antd/es/form/FormItem";
import {Select, Tabs} from "antd";
import {FormComponentProps} from 'antd/lib/form/Form';
import Checkbox from "antd/lib/checkbox";
import AceEditor from "react-ace";

interface Props {
    onSearch: (resources: Ecore.Resource[]) => void;
}

interface State {
    classes: Ecore.EObject[];
    json: string;
    splitterPosition: number;
    activeTab: string;
}

class DataSearch extends React.Component<Props & FormComponentProps, State> {
    state = {
        classes: [],
        json: JSON.stringify({contents: {eClass: "ru.neoflex.nfcore.base.auth#//User"}}, null, 4),
        splitterPosition: 50,
        activeTab: 'data_search'
    };

    handleSubmit = (e: any) => {
        e.preventDefault();
        this.props.form.validateFields((err: any, values: any) => {
            if (!err) {
                let selectedClassObject: Ecore.EObject | undefined = this.state.classes.find((c: Ecore.EObject) => c.get('name') === values.selectEClass);
                values.key === 'json_search'
                    ?
                    API.instance().find(JSON.parse(this.state.json)).then(results => {
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

    onJsonChange = (json: string) => {
        this.setState({json})
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
                                    rules: [{
                                        required: getFieldValue('key') === 'data_search',
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
                                <div>
                                    <AceEditor
                                        ref={"aceEditor"}
                                        mode={"json"}
                                        width={""}
                                        onChange={this.onJsonChange}
                                        editorProps={{$blockScrolling: true}}
                                        value={this.state.json}
                                        showPrintMargin={false}
                                        theme={"tomorrow"}
                                        debounceChangePeriod={500}
                                        height={"100px"}
                                        minLines={5}
                                    />
                                </div>
                            </Form.Item>
                        </TabPane>
                    </Tabs>
                )}
                <FormItem>
                    <Button type="primary" htmlType="submit">Search</Button>
                </FormItem>
            </Form>
        );
    }
}

export const WrappedDataSearch = Form.create<Props & FormComponentProps>()(DataSearch);