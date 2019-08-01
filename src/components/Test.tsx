import * as React from "react";
import {Checkbox, Form} from 'antd';
import FormItem from "antd/es/form/FormItem";
import {WrappedSearchGrid} from "./SearchGrid";
import {Ecore} from "ecore";

interface Props {
}

interface State {
    selectOn: boolean;
    actionOn: boolean;
    specialEClass: string;
}

export class Test extends React.Component<any, State> {
    state = {
        selectOn: false,
        actionOn: false,
        specialEClass: 'Role'
    };

    CheckSelectOn = () => {
        this.setState({selectOn: !this.state.selectOn})
    };

    CheckActionOn = () => {
        this.setState({actionOn: !this.state.actionOn})
    };

    CheckEClassOn = () => {
        this.setState({specialEClass: this.state.specialEClass != '' ? '' : 'Role'})
    };


    hendler = (resources: Ecore.Resource[]) => {};

    render() {
        return (
            <Form>
                <FormItem>
                    <Checkbox style={{marginLeft: '10px'}} onChange={this.CheckSelectOn}>Select On</Checkbox>
                    <Checkbox style={{marginLeft: '10px'}} onChange={this.CheckActionOn}>Action On</Checkbox>
                    <Checkbox defaultChecked={true} style={{marginLeft: '10px'}} onChange={this.CheckEClassOn}>EClass Role Only</Checkbox>
                </FormItem>
                <FormItem>
                    {this.state.specialEClass === undefined
                        ?
                        this.state.selectOn
                            ?
                            <WrappedSearchGrid onSelect={this.hendler} showAction={this.state.actionOn}/>
                            :
                            <WrappedSearchGrid showAction={this.state.actionOn}/>
                            :
                        this.state.selectOn
                            ?
                            <WrappedSearchGrid onSelect={this.hendler} showAction={this.state.actionOn} specialEClass={this.state.specialEClass}/>
                            :
                            <WrappedSearchGrid showAction={this.state.actionOn} specialEClass={this.state.specialEClass}/>
                    }
                </FormItem>
            </Form>
        );
    }
}