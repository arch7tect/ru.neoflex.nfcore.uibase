import * as React from "react";
const ecore =  require('ecore');
const {Ecore} = ecore;

export interface Props {
    name: string;
}

interface State {
}

export class EcoreApp extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {}
    }

    componentDidMount(): void {
        fetch("/emf/packages").then(response=>{
            if (!response.ok) {
                response.json().then(json => {
                    console.log(json.message, response.statusText);
                }).catch(error => {
                    console.log(response.statusText);
                })
                throw Error()
            }
            return response
        }).catch(error => {
            if (error && error.message) {
                console.log(error.message);
            }
            return Promise.reject()
        }).then(response => response.json()).then(json => {
            console.log(json);
        })
    }

    render() {
        return (
            <h1>Hello from EcoreApp</h1>
        );
    }
}