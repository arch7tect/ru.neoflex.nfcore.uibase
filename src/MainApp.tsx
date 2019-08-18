import * as React from "react";
import Splitter from './components/CustomSplitter'
import {Button, Tooltip} from "antd";
import {Icon as IconFA} from 'react-fa';
import './MainApp.css'


const FooterHeight = '2em'

interface State {
    appName: string
    hideReferences: boolean
    currentTool?: string
}

export class MainApp extends React.Component<any, State> {
    private refSplitterRef: React.RefObject<any> = React.createRef()
    private toolsSplitterRef: React.RefObject<any> = React.createRef()

    constructor(props: any) {
        super(props)
        this.state = {appName: props.appName, hideReferences: false}
    }

    renderToolButton=(name: string, label: string, icon: string)=>{
        return <span className={this.state.currentTool === name?"tool-button-selected":"tool-button"} onClick={() => {
            this.setState({currentTool: this.state.currentTool === name ? undefined : name})
        }}><IconFA className="magnify" name={icon}><span style={{paddingLeft: 5}}>{label}</span></IconFA></span>
    }

    renderFooter = () => {
        return (
            <div>
                <Tooltip title={this.state.hideReferences ? "Show" : "Hide"}>
                    <Button size={"small"} type="dashed" shape="round" onClick={() => {
                        this.setState({hideReferences: !this.state.hideReferences})
                    }}><IconFA name="bars"></IconFA></Button>
                </Tooltip>
                {this.renderToolButton("log", "Log", "ellipsis-v")}
                {this.renderToolButton("search", "Search", "search")}
           </div>
        )
    }

    renderToolbox = () => {
        return this.state.currentTool
    }

    renderContent = () => {
        return this.state.appName
    }

    renderReferences = () => {
        return "References"
    }

    render = () => {
        return (
            <div style={{flexGrow: 1}}>
                <Splitter
                    minimalizedPrimaryPane={this.state.hideReferences}
                    ref={this.refSplitterRef}
                    position="vertical"
                    primaryPaneMaxWidth="50%"
                    primaryPaneMinWidth={0}
                    primaryPaneWidth={localStorage.getItem('mainapp_refsplitter_pos') || "40px"}
                    dispatchResize={true}
                    postPoned={false}
                    onDragFinished={() => {
                        const size: string = this.refSplitterRef.current!.panePrimary.props.style.width
                        localStorage.setItem('mainapp_refsplitter_pos', size)
                    }}
                >
                    <div style={{flexGrow: 1}}>
                        {this.renderReferences()}
                    </div>
                    <div style={{height: '100%', width: '100%', overflow: 'auto'}}>
                        <div style={{height: `calc(100% - ${FooterHeight})`, width: '100%', overflow: 'auto'}}>
                            <Splitter
                                ref={this.toolsSplitterRef}
                                position="horizontal"
                                primaryPaneMaxHeight="100%"
                                primaryPaneMinHeight="0%"
                                primaryPaneHeight={localStorage.getItem('mainapp_toolssplitter_pos') || "400px"}
                                dispatchResize={true}
                                postPoned={false}
                                onDragFinished={() => {
                                    const size: string = this.toolsSplitterRef.current!.panePrimary.props.style.height
                                    localStorage.setItem('mainapp_toolssplitter_pos', size)
                                }}
                            >
                                <div style={{flexGrow: 1}}>
                                    {this.renderContent()}
                                </div>
                                {this.state.currentTool !== undefined && <div style={{height: '100%', width: '100%', overflow: 'auto'}}>
                                    {this.renderToolbox()}
                                </div>}
                            </Splitter>
                        </div>
                        <div style={{height: `${FooterHeight}`}}>
                            {this.renderFooter()}
                        </div>
                    </div>
                </Splitter>
            </div>
        )
    }
}