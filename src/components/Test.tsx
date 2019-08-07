import * as React from "react";
import {Checkbox, Form} from 'antd';
import FormItem from "antd/es/form/FormItem";
import {WrappedSearchGrid} from "./SearchGrid";
import {Ecore} from "ecore";
import {API} from "../modules/api";

interface Props {
}

interface State {
    selectOn: boolean;
    actionOn: boolean;
    specialEClassStr: string;
    specialEClass?: Ecore.EClass;
    classes: Ecore.EObject[];
}

export class Test extends React.Component<any, State> {
    state = {
        selectOn: false,
        actionOn: false,
        specialEClassStr: 'Role',
        specialEClass: undefined,
        classes: []
    };

    CheckSelectOn = () => {
        this.setState({selectOn: !this.state.selectOn})
    };

    CheckActionOn = () => {
        this.setState({actionOn: !this.state.actionOn})
    };

    hendler = (resources: Ecore.Resource[]) => {};

    getEClasses = () => {
        this.state.specialEClass === undefined
        ?
        API.instance().fetchAllClasses(false).then(classes => {
            const filtered = classes.filter((c: Ecore.EObject) =>
                !c.get('interface') && c._id === "//Role");
            this.setState({specialEClass: filtered[0]})
        })
            :
            this.setState({specialEClass: undefined})
    };

    render() {
        return (
            <Form>
                <FormItem>
                    <Checkbox style={{marginLeft: '10px'}} onChange={this.CheckSelectOn}>Select On</Checkbox>
                    <Checkbox style={{marginLeft: '10px'}} onChange={this.CheckActionOn}>Action On</Checkbox>
                    <Checkbox defaultChecked={false} style={{marginLeft: '10px'}} onChange={this.getEClasses}>EClass Role Only</Checkbox>
                </FormItem>
                <FormItem>
                    {
                        this.state.specialEClass === undefined
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