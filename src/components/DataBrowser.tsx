import * as React from "react";
import {Table} from 'antd';
import {Ecore} from "ecore";
import {Resource} from "../modules/resource";

export interface Props {
}

interface State {
}

export class DataBrowser extends React.Component<any, State> {
    state = {};

    componentDidMount(): void {
    }

    render() {
        return (
            <div>DataBrowser</div>
        );
    }
}