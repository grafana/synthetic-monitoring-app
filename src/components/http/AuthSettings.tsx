import React, { PureComponent } from 'react';
import { css } from 'emotion';
import { Container, HorizontalGroup, Field, Switch, Input, VerticalGroup } from '@grafana/ui';
import { Collapse } from 'components/Collapse';
import { BasicAuth } from 'types';

interface Props {
  bearerToken?: string;
  basicAuth?: BasicAuth;
  isEditor: boolean;
  onUpdate: (bearerToken: string | undefined, basicAuth: BasicAuth | undefined) => void;
}

interface State {
  hasBasicAuth: boolean;
  hasBearerToken: boolean;
  basicAuth?: BasicAuth;
  token?: string;
  showAuthentication: boolean;
}

export class AuthSettings extends PureComponent<Props, State> {
  state: State = {
    hasBasicAuth: false,
    hasBearerToken: false,
    showAuthentication: false,
  };

  componentDidMount() {
    const { bearerToken, basicAuth } = this.props;
    let hasBearerToken = false;
    let hasBasicAuth = false;
    if (bearerToken && bearerToken.length > 0) {
      hasBearerToken = true;
    } else if (basicAuth && (basicAuth.username.length > 0 || basicAuth.password.length > 0)) {
      hasBasicAuth = true;
    }

    this.setState({
      hasBasicAuth: hasBasicAuth,
      hasBearerToken: hasBearerToken,
      token: bearerToken,
      basicAuth: basicAuth,
    });
  }

  onUpdate = () => {
    this.props.onUpdate(this.state.token, this.state.basicAuth);
  };

  onToggleAuthentication = (isOpen: boolean) => {
    this.setState({ showAuthentication: !this.state.showAuthentication });
  };

  onBearerTokenChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ token: event.target.value }, this.onUpdate);
  };

  onBasicAuthChange = (basicAuth: BasicAuth | undefined) => {
    let { hasBasicAuth, hasBearerToken, token } = this.state;
    if (basicAuth) {
      hasBasicAuth = true;
      hasBearerToken = false;
      token = undefined;
    } else {
      hasBasicAuth = false;
    }
    this.setState({ basicAuth, hasBasicAuth, hasBearerToken, token }, this.onUpdate);
  };

  onHasBearerAuth = (event: React.ChangeEvent<HTMLInputElement>) => {
    let { hasBasicAuth, basicAuth, hasBearerToken, token } = this.state;

    if (hasBearerToken) {
      // if hasBearerToken is set, then we are now removing BearerToken
      token = undefined;
    } else if (hasBasicAuth) {
      // if we are turning on hasBearerToken, then we must turn off basicAuth
      hasBasicAuth = false;
      basicAuth = undefined;
    }
    hasBearerToken = !hasBearerToken;
    this.setState({ hasBasicAuth, basicAuth, hasBearerToken, token }, this.onUpdate);
  };

  render() {
    const { showAuthentication, hasBearerToken, token, basicAuth } = this.state;
    const { isEditor } = this.props;

    return (
      <Collapse
        label="Authentication"
        collapsible={true}
        onToggle={this.onToggleAuthentication}
        isOpen={showAuthentication}
      >
        <VerticalGroup spacing="xs">
          <Field
            label="Bearer Token"
            description="Include bearer Authorization header in request"
            disabled={!isEditor}
            horizontal={true}
            className={
              !hasBearerToken
                ? undefined
                : css`
                    margin-bottom: 1px;
                  `
            }
          >
            <Container margin="sm">
              <Switch value={hasBearerToken} onChange={this.onHasBearerAuth} disabled={!isEditor} />
            </Container>
          </Field>
          {hasBearerToken && (
            <VerticalGroup>
              <Input
                type="password"
                placeholder="Bearer Token"
                value={token}
                onChange={this.onBearerTokenChange}
                disabled={!isEditor}
              />
              <br />
            </VerticalGroup>
          )}
        </VerticalGroup>
        <BasicAuthForm onChange={this.onBasicAuthChange} basicAuth={basicAuth} isEditor={isEditor} />
      </Collapse>
    );
  }
}

interface BasicAuthProps {
  basicAuth?: BasicAuth;
  isEditor: boolean;
  onChange: (basicAuth: BasicAuth | undefined) => void;
}

interface BasicAuthState {
  username: string;
  password: string;
  hasBasicAuth: boolean;
}

export class BasicAuthForm extends PureComponent<BasicAuthProps, BasicAuthState> {
  state = {
    username: this.props.basicAuth?.username || '',
    password: this.props.basicAuth?.password || '',
    hasBasicAuth: this.props.basicAuth ? true : false,
  };

  componentDidUpdate(oldProps: BasicAuthProps) {
    this.setState({
      username: this.props.basicAuth?.username || '',
      password: this.props.basicAuth?.password || '',
      hasBasicAuth: this.props.basicAuth ? true : false,
    });
  }

  onUpdate = () => {
    if (!this.state.hasBasicAuth) {
      this.props.onChange(undefined);
      return;
    }
    const auth = {
      username: this.state.username,
      password: this.state.password,
    };
    this.props.onChange(auth);
  };

  onUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ username: event.target.value }, this.onUpdate);
  };

  onPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ password: event.target.value }, this.onUpdate);
  };

  onHasBasicAuth = (event: React.ChangeEvent<HTMLInputElement>) => {
    let { hasBasicAuth, username, password } = this.state;

    if (hasBasicAuth) {
      // if hasBasicAuth is set, then we are now removing basicAuth
      username = '';
      password = '';
    }
    hasBasicAuth = !hasBasicAuth;
    this.setState({ hasBasicAuth, username, password }, this.onUpdate);
  };

  render() {
    const { username, password, hasBasicAuth } = this.state;
    const { isEditor } = this.props;

    return (
      <VerticalGroup spacing="xs">
        <Field
          label="Basic Auth"
          description="Include Basic Authorization header in request"
          disabled={!isEditor}
          horizontal={true}
          className={
            !hasBasicAuth
              ? undefined
              : css`
                  margin-bottom: 1px;
                `
          }
        >
          <Container margin="sm">
            <Switch value={hasBasicAuth} onChange={this.onHasBasicAuth} disabled={!isEditor} />
          </Container>
        </Field>
        {hasBasicAuth && (
          <HorizontalGroup>
            <Input
              type="text"
              placeholder="username"
              value={username}
              onChange={this.onUsernameChange}
              disabled={!isEditor}
            />
            <Input
              type="password"
              placeholder="password"
              value={password}
              onChange={this.onPasswordChange}
              disabled={!isEditor}
            />
          </HorizontalGroup>
        )}
      </VerticalGroup>
    );
  }
}
