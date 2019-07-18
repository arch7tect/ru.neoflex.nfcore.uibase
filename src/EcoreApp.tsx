import * as React from "react";
import {Layout, Menu} from 'antd';
import 'antd/dist/antd.css';
//import {Ecore} from "ecore";
//import {API} from './modules/resource'
import {MetaBrowser} from "./components/MetaBrowser";
import {ResourceEditor} from "./components/ResourceEditor"
import {Link, Route, RouteComponentProps, Switch} from "react-router-dom";
import {DataBrowser} from "./components/DataBrowser";
import {QueryRunner} from "./components/QueryRunner";
import {API} from "./modules/api";

const { Content, Sider } = Layout;

export interface Props extends RouteComponentProps {
    name: string;
}

interface State {
    principal: any|undefined;
    userName: string|undefined;
    password: string|undefined;
}

export class EcoreApp extends React.Component<any, State> {
    state = {principal: undefined, userName: undefined, password: undefined}

    componentDidMount(): void {
    }

    render() {
        return (
            <Layout>
                {this.state.principal === undefined ?
                    <Layout>
                        {this.renderLogin()}
                    </Layout>
                    :
                    <Layout>
                        {this.renderDef()}
                    </Layout>
                }
            </Layout>
        );
    }

    renderDef() {
        let selectedKeys = ['metadata', 'data', 'query']
            .filter(k => this.props.location.pathname.split('/').includes(k))
        return (
            <Layout>
                <Layout>
                    <Sider collapsible breakpoint="lg" collapsedWidth="0">
                        <Menu theme="dark" mode="inline" selectedKeys={selectedKeys}>
                            <Menu.Item key={'metadata'}><Link to={`/metadata`}>Metadata</Link></Menu.Item>
                            <Menu.Item key={'data'}><Link to={`/data`}>Data</Link></Menu.Item>
                            <Menu.Item key={'query'}><Link to={`/query`}>Query</Link></Menu.Item>
                        </Menu>
                    </Sider>
                    <Layout style={{height: '100vh'}}>
                        <Content>
                            <Switch>
                                <Route path='/metadata' component={MetaBrowser}/>
                                <Route exact={true} path='/data' component={DataBrowser}/>
                                <Route path='/data/:id' component={ResourceEditor}/>
                                <Route path='/query' component={QueryRunner}/>
                            </Switch>
                        </Content>
                    </Layout>
                </Layout>
            </Layout>
        )
    }

    renderLogin() {
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
                                onKeyUp={e => {
                                    this.authenticateIfEnterPress(e)
                                }}
                            />
                            <input
                                className="input-border"
                                key="pass"
                                type="password"
                                placeholder="password"
                                onChange={e => {
                                    this.setState({password: e.target.value})
                                }}
                                onKeyUp={e => {
                                    this.authenticateIfEnterPress(e)
                                }}
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
            .then(principal => {
                this.setState({principal})
            })
    };

    authenticateIfEnterPress(e:any) {
        if (e.keyCode === 13) {
            this.authenticate()
        }}
}