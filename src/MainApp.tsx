import * as React from "react";
import Splitter from './components/CustomSplitter'

const FooterHeight = '2em'

interface State {
    appName: string
    hideReferences: boolean
}

export class MainApp extends React.Component<any, State> {
    private refSplitterRef: React.RefObject<any> = React.createRef()
    private toolsSplitterRef: React.RefObject<any> = React.createRef()

    constructor(props: any) {
        super(props)
        this.state = {appName: props.appName, hideReferences: false}
    }

    renderFooter = ()=>{
        return "Footer"
    }

    renderToolbox = ()=>{
        return "Toolbox"
    }

    renderContent = ()=>{
        return this.state.appName
    }

    renderReferences = ()=>{
        return "References"
    }

    render = () => {
        return (
            <div style={{ flexGrow: 1 }}>
                <Splitter
                    minimalizedPrimaryPane={this.state.hideReferences}
                    ref={this.refSplitterRef}
                    position="vertical"
                    primaryPaneMaxWidth="50%"
                    primaryPaneMinWidth={0}
                    primaryPaneWidth={localStorage.getItem('mainapp_refsplitter_pos') || "40px"}
                    dispatchResize={true}
                    postPoned={false}
                    onDragFinished={()=>{
                        const size:string = this.refSplitterRef.current!.panePrimary.props.style.width
                        localStorage.setItem('mainapp_refsplitter_pos', size)
                    }}
                >
                    <div style={{ flexGrow: 1 }}>
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
                                onDragFinished={()=>{
                                    const size:string = this.toolsSplitterRef.current!.panePrimary.props.style.height
                                    localStorage.setItem('mainapp_toolssplitter_pos', size)
                                }}
                            >
                                <div style={{ flexGrow: 1 }}>
                                    {this.renderContent()}
                                </div>
                                <div style={{ height: '100%', width: '100%', overflow: 'auto' }}>
                                    {this.renderToolbox()}
                                </div>
                            </Splitter>
                        </div>
                        <div style={{ height: `${FooterHeight}` }}>
                            {this.renderFooter()}
                        </div>
                    </div>
                </Splitter>
            </div>
        )
    }
}