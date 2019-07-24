import * as React from "react";
import {Col, Layout, Menu, Row} from 'antd';
import 'antd/dist/antd.css';
//import {Ecore} from "ecore";
import {API} from './modules/api'
import {MetaBrowser} from "./components/MetaBrowser";
import {ResourceEditor} from "./components/ResourceEditor"
import {Link, Route, RouteComponentProps, Switch} from "react-router-dom";
import {DataBrowser} from "./components/DataBrowser";
import {QueryRunner} from "./components/QueryRunner";
import {Login} from "./components/Login";

const { Header, Content, Sider, Footer } = Layout;

export interface Props extends RouteComponentProps {
    name: string;
}

interface State {
    principal?: any;
}

export class EcoreApp extends React.Component<any, State> {
    state = {principal: undefined};

    onRightMenu(e : any) {
        if (e.key == "logout") {
            API.instance().logout().then(() => {
                this.setState({principal : undefined});

            })
        }
    }

    setPrincipal = (principal: any)=>{
        this.setState({principal}, API.instance().init)
    };

    render() {
        return (
            <Layout>
                {this.state.principal === undefined ?
                    <Layout>
                        <Login onLoginSucceed={this.setPrincipal}/>
                    </Layout>
                    :
                    <Layout>
                        {this.renderDef()}
                    </Layout>
                }
            </Layout>
        )
    }

    renderDef() {
        let selectedKeys = ['metadata', 'data', 'query', 'login']
            .filter(k => this.props.location.pathname.split('/').includes(k));
        let principal = this.state.principal as any;
        return (
            <Layout>
                <Header style={{height: '4vh'}}>
                    <Row type="flex" justify="space-between">
                        <Col style={{marginLeft : '150vh'}} >
                            <Menu mode="horizontal" theme="dark" onClick={(e) => this.onRightMenu(e)}>
                                <Menu.SubMenu title={<span>{principal.name}</span>} style={{float: "right", height: '4vh'}}>
                                    <Menu.Item key={'logout'}>Logout</Menu.Item>
                                </Menu.SubMenu>
                            </Menu>
                        </Col>
                    </Row>
                </Header>
                <Layout>
                    <Sider collapsible breakpoint="lg" collapsedWidth="0">
                        <Menu theme="dark" mode="inline" selectedKeys={selectedKeys}>
                            <Menu.Item key={'metadata'}><Link to={`/metadata`}>Metadata</Link></Menu.Item>
                            <Menu.Item key={'data'}><Link to={`/data`}>Data</Link></Menu.Item>
                            <Menu.Item key={'query'}><Link to={`/query`}>Query</Link></Menu.Item>
                        </Menu>
                    </Sider>
                    <Layout style={{height: '96vh'}}>
                        <Content>
                            <Switch>
                                <Route path='/metadata' component={MetaBrowser}/>
                                <Route exact={true} path='/data' component={DataBrowser}/>
                                <Route path='/data/:id/:ref' component={ResourceEditor}/>
                                <Route path='/query' component={QueryRunner}/>
                            </Switch>
                        </Content>
                    </Layout>
                </Layout>
            </Layout>
        )
    }
}