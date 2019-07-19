import * as React from "react";
import {Layout} from 'antd';
import {API} from "../modules/api";

const { Content } = Layout;

export interface Props {
    onLoginSucceed: (principal: any)=>void;
}

interface State {
    principal: any|undefined;
    userName: string|undefined;
    password: string|undefined;
}

export class Login extends React.Component<Props, State> {
    state = {principal: undefined, userName: undefined, password: undefined}

    render() {
        return (
            <Layout>
                <Content style={{height: '75vh', backgroundColor: '#ffffff'}}>
                    <div className='form-div'>
                        <br/>
                        <Layout>
                            <input
                                autoFocus
                                className="input-border"
                                key="user"
                                placeholder="User Name"
                                onChange={e => {
                                    this.setState({userName: e.target.value})
                                }}
                                onKeyUp={this.authenticateIfEnterPress}
                            />
                            <input
                                className="input-border"
                                key="pass"
                                type="password"
                                placeholder="password"
                                onChange={e => {
                                    this.setState({password: e.target.value})
                                }}
                                onKeyUp={this.authenticateIfEnterPress}
                            />
                            <button key="conbutton" className="custom-button"
                                    onClick={this.authenticate}>Sign in
                            </button>
                        </Layout>
                    </div>
                </Content>
            </Layout>
        )
    }

    authenticate = () => {
        API.instance().authenticate(this.state.userName, this.state.password)
            .then((principal)=>{
                this.props.onLoginSucceed(principal)
            })
};

    authenticateIfEnterPress = (e:any) => {
        if (e.keyCode === 13) {
            this.authenticate()
        }};

}