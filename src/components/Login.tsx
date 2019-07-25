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
    waitMinute: boolean;
}

export class Login extends React.Component<Props, State> {
    state = {principal: undefined, userName: undefined, password: undefined, waitMinute: true}

    componentDidMount(): void {
        this.authenticate().catch(()=>{
            this.setState({waitMinute: false})
        })
    }

    render() {
        if (this.state.waitMinute === true) {
            return (
                <div className="loader"></div>
            )
        }
        else {
            return (
                <div>
                    <Layout>
                        <Header style={{height: '30vh', backgroundColor: '#ffffff'}}>
                            <Row type="flex" justify="space-between">
                                <Col span={1}>
                                    <img alt="The great and terrible" src={logo2} className="logo"/>
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
    }

    authenticate = () => {
        return API.instance().authenticate(this.state.userName, this.state.password)
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