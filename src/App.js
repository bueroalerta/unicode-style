// @flow
import 'sanitize.css';
import 'draft-js-inline-toolbar-plugin/lib/plugin.css';
import 'draft-js/dist/Draft.css';
import styles from './App.module.css';
import * as React from 'react';
import Editor from 'draft-js-plugins-editor';
import cx from 'classnames';
import { EditorState, RichUtils } from 'draft-js';
import type { DraftHandleValue } from 'draft-js/lib/DraftHandleValue';
import { styleInsertion, styleSelection } from './transform';
import { InlineToolbar, inlineToolbarPlugin } from './Toolbar';
import Buttons from './Buttons';
import Header from './Header';

// Remove any CSS changes from inline styles, since we're styling by changing
// the content — not applying CSS rules.
const STYLE_MAP = {
  BOLD: {},
  UNDERLINE: {},
  STRIKETHROUGH: {},
  ITALIC: {},
  CODE: {},
  DOUBLE: {},
  SCRIPT: {},
  FRAKTUR: {}
};

type Props = {};

type State = {
  editorState: EditorState
};

class App extends React.Component<Props, State> {
  state = {
    editorState: EditorState.createEmpty()
  };

  handleKeyCommand = (
    command: string,
    editorState: EditorState
  ): DraftHandleValue => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return 'handled';
    }

    return 'not-handled';
  };

  handleBeforeInput = (
    str: string,
    editorState: EditorState
  ): DraftHandleValue => {
    const newState = styleInsertion(editorState, str);
    this.onChange(newState);
    return 'handled';
  };

  onChange = (editorState: EditorState) => {
    const currentContent = this.state.editorState.getCurrentContent();
    const currentStyle = this.state.editorState.getCurrentInlineStyle();
    const rawStyle = editorState.getCurrentInlineStyle();
    const newContent = editorState.getCurrentContent();
    const lastChange = editorState.getLastChangeType();
    if (
      currentContent === newContent ||
      lastChange !== 'change-inline-style' ||
      currentStyle === rawStyle
    ) {
      return this.setState({ editorState });
    }

    this.setState({
      editorState: styleSelection(this.state.editorState, editorState)
    });
  };

  componentDidMount() {
    this.refs.editor.focus();
  }

  render() {
    const { editorState } = this.state;
    const plainText = editorState.getCurrentContent().getPlainText();
    return (
      <div className={styles.content}>
        <Header />
        <p className={cx(styles.paragraph, { [styles.faded]: plainText })}>
          Format text using unicode characters. Paste anywhere that accepts
          plain text.
        </p>
        <Editor
          ref="editor"
          placeholder="Write, highlight, and style away."
          editorState={editorState}
          handleKeyCommand={this.handleKeyCommand}
          handleBeforeInput={this.handleBeforeInput}
          onChange={this.onChange}
          plugins={[inlineToolbarPlugin]}
          customStyleMap={STYLE_MAP}
        />
        <InlineToolbar />
        <Buttons text={plainText} />
      </div>
    );
  }
}

export default App;
