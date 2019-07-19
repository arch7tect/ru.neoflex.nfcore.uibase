import * as React from "react";
import { Layout, Row, Col,Button } from 'antd'
import {API} from "../modules/api";
import logo2 from '../logo2.png';
const { Header, Content } = Layout;

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
            <div>
                <Layout>
                    <Header style={{ height: '30vh', backgroundColor: '#ffffff' }}>
                        <Row type="flex"  justify="space-between">
                            <Col span={16}>
                            {/*<Button style={{height: '27vh', width: '29vh',backgroundColor: '#ffffff'}}>*/}
                                <img src={logo2} className="logo"/>
                            {/*</Button>*/}
                            </Col>
                            <Col>
                                <Button type="dashed">
                                    {/*Настроить переключение языков*/}
                                    EN
                                </Button>
                            </Col>
                        </Row>
                    </Header>
                        <Content style={{height: '65vh', backgroundColor: '#ffffff'}}>
                            <div className='form-div'>
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
                            </div>
                        </Content>
                    {/*<Footer style={{ height: '5vh', backgroundColor: '#ffdedf' }} />*/}
                </Layout>
            </div>
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
        }
    };
}