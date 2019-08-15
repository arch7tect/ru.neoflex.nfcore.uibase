import * as React from "react";

interface State {
    appName: string
}

export class MainApp extends React.Component<any, State> {
    constructor(props: any) {
        super(props)
        this.state = {appName: props.appName}
    }

    render = () => {
        return <div>{this.state.appName}</div>
    }
}