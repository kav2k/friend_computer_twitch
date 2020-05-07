// Just a note: those are quick, dirty and incomplete typings made by hand for twitch-js.
// If you're going to reuse them, do so at your own risk.
// I wouldn't pick the same library again...

declare module "twitch-js" {
  import EventEmitter from "eventemitter3";
  import { Consola } from "consola";

  export const enum ApiReadyState {
    NOT_READY = 0,
    READY,
    INITIALIZED
  }

  type LogOptions = any; // TODO

  interface ApiOptionsBase {
    log?: LogOptions,
    onAuthenticationFailure?: Function
  }

  interface ApiOptionsToken extends ApiOptionsBase {
    token: string
  }

  interface ApiOptionsClientId extends ApiOptionsBase {
    clientId: string
  }

  export type ApiOptions = ApiOptionsClientId | ApiOptionsToken;

  export interface ApiStatusState {
    token: {
      authorization: {
        scopes: string[],
        createdAt: string,
        updatedAt: string
      },
      clientId: string,
      userId: string,
      userName: string,
      valid: boolean
    }
  }

  export interface FetchOptions {
    method?: string,
    headers?: any,
    search?: any,
    body?: any | FormData
  }

  interface FetchOptionsVersion extends FetchOptions {
    version?: string
  }

  export class Api {
    private _options: ApiOptions;
    private _log: Consola;
    private _readyState: ApiReadyState;
    private _status: ApiStatusState;

    constructor(maybeOptions: ApiOptions);

    set options(maybeOptions: ApiOptions);
    get options(): ApiOptions;

    get readyState(): ApiReadyState;
    get status(): ApiStatusState;

    public updateOptions(options: ApiOptionsBase): void;
    private initialize(options?: ApiOptions): Promise<ApiStatusState | void>; // TODO

    private hasScope(scope: string): Promise<boolean>;

    public get(endpoint: string, options?: FetchOptions): Promise<any>;
    public post(endpoint: string, options?: FetchOptions): Promise<any>;
    public put(endpoint: string, options?: FetchOptions): Promise<any>;

    private _isVersionHelix(version: string): boolean;
    private _getBaseUrl(options: { version?: string }): string;
    private _getHeaders(options: { version?: string }): any; // TODO

    private _handleFetch(url?: string, options?: FetchOptionsVersion): Promise<any>;
  }

  interface ChatOptions {
    username?: string,
    token?: string,
    isKnown?: boolean,
    isVerified?: boolean,
    connectionTimeout?: number,
    joinTimeout?: number,
    log?: LogOptions,
    onAuthenticationFailure?: Function
  }

  export const enum ClientReadyState {
    NOT_READY = 0,
    CONNECTING,
    RECONNECTING,
    CONNECTED,
    DISCONNECTING,
    DISCONNECTED
  }

  interface ClientSendOptions {
    priority?: number,
    isModerator?: boolean
  }

  class Client extends EventEmitter {}

  interface ClearChatTags {
    banReason?: string,
    banDuration?: number
  }

  interface GlobalUserStateTags {
    emoteSets: string[],
    userType: string,
    username: string
  }

  interface BadgesTag {
    admin?: boolean,
    bits?: number,
    broadcaster?: boolean,
    globalMod?: boolean,
    moderator?: boolean,
    subscriber?: boolean,
    staff?: boolean,
    turbo?: boolean
  }

  interface EmoteTag {
    id: string,
    start: number,
    end: number
  }

  interface UserStateTags {
    badges: BadgesTag,
    emotes: EmoteTag[],
    emoteSets: string[],
    bits?: number,
    displayName?: string,
    userId?: number
  }

  type PrivateMessageTags = UserStateTags;
  type UserNoticeTags = UserStateTags;

  interface RoomStateTags {
    broadcasterLang?: string,
    emoteOnly: boolean,
    followersOnly: boolean | number,
    r9k: boolean,
    slow: number,
    subsOnly: boolean
  }

  interface ChannelState {
    roomState: RoomStateTags,
    userState: UserStateTags
  }

  export interface BaseMessage {
    _raw: string,
    timestamp: Date,
    username: string,
    command: string,
    channel?: string,
    tags: ClearChatTags | GlobalUserStateTags | PrivateMessageTags | RoomStateTags | UserNoticeTags | UserStateTags | any,
    message?: string
  }

  export interface JoinOrPartMessage extends BaseMessage {
    username: string // lowercase here
  }

  export interface ModeMessage extends BaseMessage {
    event: string,
    username: string,
    isModerator: boolean
  }

  export interface NamesMessage extends BaseMessage {
    usernames: string[]
  }

  export interface NamesEndMessage extends BaseMessage {}

  export interface GlobalUserStateMessage extends BaseMessage {
    tags: GlobalUserStateTags
  }

  export interface ClearChatUserBannedMessage extends BaseMessage {
    tags: ClearChatTags,
    username: string
  }

  export interface ClearChatMessage extends BaseMessage {}

  export interface HostTargetMessage extends BaseMessage {
    numberOfViewers?: number
  }

  export interface RoomStateMessage extends BaseMessage {
    tags: RoomStateTags
  }

  export interface NoticeMessage extends BaseMessage {
    event: string,
    mods?: string[],
    tags: any
  }

  export interface UserStateMessage extends BaseMessage {
    tags: UserStateTags
  }

  export interface PrivateMessageBase extends UserStateMessage {
    channel: string,
    message: string,
    username: string
  }

  export interface PrivateMessageCheer extends UserStateMessage {
    event: "CHEER",
    bits: number,
    channel: string,
    username: string
  }

  export interface PrivateMessageHosting extends UserStateMessage {
    event: "HOSTED/WITH_VIEWERS" | "HOSTED/WITHOUT_VIEWERS" | "HOSTED/AUTO",
    numberOfViewers?: number
    channel: string,
    username: string
  }

  export type PrivateMessage = PrivateMessageBase | PrivateMessageCheer | PrivateMessageHosting;

  export interface UserNoticeMessage extends BaseMessage {
    event: string,
    parameters: any,
    systemMessage: string
  }

  export class Chat extends EventEmitter {
    private _options: ChatOptions;
    private _log: Consola;
    private _readyState: ClientReadyState;
    private _connectionAttempts: number;
    private _connectionInProgress: Promise<any> | null; // TODO
    private _userState: GlobalUserStateTags;
    private _channelState: { [key: string]: ChannelState };

    private _client: Client;

    constructor(options: ChatOptions);

    get options(): ChatOptions;
    set options(options: ChatOptions);

    public connect(): Promise<GlobalUserStateMessage>;

    public updateOptions(options: ChatOptions): void;

    public send(message: string, options?: ClientSendOptions): Promise<void>;
    
    public disconnect(): void;

    public reconnect(options?: ChatOptions): Promise<ChannelState[]>;

    public join(channel: string): Promise<ChannelState>;
    public part(channel: string): void;

    public say(channel: string, message: string, ...args: string[]): Promise<UserStateMessage>;
    public whisper(user: string, message: string): Promise<void>;
    public broadcast(message: string): Promise<UserStateMessage[]>;

    private _handleConnectionAttempt(): Promise<GlobalUserStateMessage>;
    private _handleConnectSuccess(globalUserState: GlobalUserStateMessage): GlobalUserStateMessage;
    private _handleConnectRetry(error: Error): Promise<GlobalUserStateMessage>;

    private _isUserAuthenticated(): Promise<void>;
    private _emit(event?: string, message?: BaseMessage): Promise<void>;

    // More private members
  }

  interface TwitchJsOptionsBase {
    username: string,
    log?: LogOptions,
    onAuthenticationFailure?: Function,
    api?: ApiOptions,
    chat?: ChatOptions
  }

  interface TwitchJsOptionsClientId extends TwitchJsOptionsBase {
    clientId: string
  }

  interface TwitchJsOptionsToken extends TwitchJsOptionsBase {
    token: string
  }

  export type TwitchJsOptions = TwitchJsOptionsClientId | TwitchJsOptionsToken;

  export default class TwitchJs {
    public api: Api;
    public chat: Chat;
    public readonly chatConstants: any;

    constructor(options: TwitchJsOptions);

    public updateOptions(options: { api: ApiOptionsBase, chat: ChatOptions }): void;
  }
}
