import * as React from "react";
import {WrappedSearchGrid} from "./SearchGrid";

export interface Props {}

export class DataBrowser extends React.Component<any, any> {

    render() {
        return (
            <WrappedSearchGrid showAction={true} specialEClass={undefined}/>
        );
    }}