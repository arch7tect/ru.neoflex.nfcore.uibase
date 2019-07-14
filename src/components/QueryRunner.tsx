import * as React from "react";
import {Form, Button, Tooltip} from 'antd';
//import { Ecore } from "ecore";
import { API } from "../modules/api";
import SplitPane from 'react-split-pane';
import {Icon as IconFA} from 'react-fa';
import AceEditor from "react-ace";
import 'brace/mode/json';
import 'brace/theme/tomorrow';

export interface Props {
}

interface State {
    json: string;
    result: string;
    splitterPosition: number;
}

export class QueryRunner extends React.Component<any, State> {
    state = {
        json: JSON.stringify({contents: {eClass: "ru.neoflex.nfcore.base.auth#//User"}}, null, 4),
        result: '',
        splitterPosition: 50
    }

    run = () => {
        API.instance().find(JSON.parse(this.state.json)).then(results=>{
            const {executionStats, resources, bookmark, warning} = results;
            const objects = resources.map(r=>
                Object.assign(r.to(), {$ref: `${r.get('uri')}?rev=${r.rev}`})
            );
            this.setState({result: JSON.stringify({objects, executionStats, bookmark, warning}, null, 4)});
        })
    }

    resizeEditors = () => {
        (this.refs.aceEditor as AceEditor).editor.resize()
        if (this.refs.console) {
            (this.refs.console as AceEditor).editor.resize()
        }
    }

    onSplitterChange = (value: number) => {
        this.resizeEditors();
        this.setState({splitterPosition: value});
    }

    onJsonChange = (json: string) => {
        this.setState({json})
    }

    render() {
        return (
            <div style={{display: 'flex', flexFlow: 'column', height: '100%'}}>
                <Form layout={"inline"}>
                    <Form.Item wrapperCol={{span: 2, push: 14}}>
                        <Tooltip placement="top" title={"Run"}>
                            <Button id="run" shape="circle" style={{border: 0}} onClick={this.run}>
                                <IconFA name="question-circle"/>
                            </Button>
                        </Tooltip>
                    </Form.Item>
                </Form>
                <div style={{flexGrow: 1}}>
                    <SplitPane split="horizontal" primary="first" minSize={10}
                               defaultSize={this.state.splitterPosition}
                               onChange={this.onSplitterChange}
                    >
                        <div style={{height: '100%', width: '100%', overflow: 'auto'}}>
                            <AceEditor
                                ref={"aceEditor"}
                                mode={"json"}
                                width={""}
                                onChange={this.onJsonChange}
                                editorProps={{$blockScrolling: true}}
                                value={this.state.json}
                                theme={"tomorrow"}
                                debounceChangePeriod={500}
                                height={"100%"}
                                minLines={5}
                            />
                        </div>
                        <div style={{height: '100%', width: '100%', overflow: 'auto'}}>
                            <AceEditor
                                ref={"console"}
                                mode={'json'}
                                width={''}
                                height={'100%'}
                                theme={'tomorrow'}
                                fontSize={15}
                                editorProps={{$blockScrolling: Infinity}}
                                value={this.state.result}
                                showPrintMargin={false}
                                focus={false}
                                readOnly={true}
                                minLines={5}
                                highlightActiveLine={false}
                            />
                        </div>
                    </SplitPane>
                </div>
            </div>
        );
    }
}