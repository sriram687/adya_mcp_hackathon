"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientAndServerExecution = ClientAndServerExecution;
var server_connection_js_1 = require("./server_connection.js");
var azure_openai_js_1 = require("./llm/azure_openai.js");
var openai_js_1 = require("./llm/openai.js");
var gemini_js_1 = require("./llm/gemini.js");
function ClientAndServerExecution(payload, streaming_callback) {
    return __awaiter(this, void 0, void 0, function () {
        var ClientAndServerExecution, selected_server_credentials, client_details, selected_client, selected_server, temp_tools, temp_prompt, tool_call_details_arr, _i, _a, tool, tools_getting_agent_prompt, initialLlmResponse, extractedResult, final_tool_calls, _loop_1, _b, _c, tool_name, response, _d, _e, message, _f, _g, tool, toolName, args, tool_call_result, tool_call_content_data, normalResponse, _h, _j, message, final_tool_calls, _loop_2, _k, _l, tool_name, response, _m, _o, message, _p, _q, tool, toolName, args, tool_call_result, tool_call_content_data, initialLlmResponse, extractedResult, final_tool_calls, _loop_3, _r, _s, tool_name, response, _t, _u, message, _v, _w, part, toolName, args, tool_call_result_1, tool_call_content_data, normalResponse, _x, _y, message, final_tool_calls, _loop_4, _z, _0, tool_name, response, _1, _2, message, _3, _4, part, toolName, args, tool_call_result_2, tool_call_content_data, initialLlmResponse, extractedResult, final_tool_calls, _loop_5, _5, _6, tool_name, response, _7, _8, message, _9, _10, tool, toolName, args, tool_call_result, tool_call_content_data, normalResponse, _11, _12, message, final_tool_calls, _loop_6, _13, _14, tool_name, response, _15, _16, message, _17, _18, tool, toolName, args, tool_call_result, tool_call_content_data, err_1;
        var _19, _20, _21, _22, _23, _24;
        var _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, _40, _41, _42, _43, _44, _45, _46, _47, _48, _49, _50, _51, _52, _53, _54, _55, _56, _57, _58, _59, _60, _61, _62, _63, _64, _65, _66, _67, _68, _69, _70, _71, _72, _73, _74, _75, _76, _77, _78, _79, _80, _81, _82, _83, _84, _85, _86, _87, _88, _89, _90, _91, _92, _93, _94, _95, _96, _97, _98, _99, _100, _101, _102, _103, _104, _105, _106, _107, _108, _109, _110, _111, _112, _113, _114, _115, _116, _117, _118, _119, _120, _121, _122, _123, _124, _125, _126, _127, _128, _129, _130, _131, _132, _133, _134, _135, _136, _137, _138, _139, _140, _141, _142, _143, _144, _145, _146, _147, _148, _149, _150, _151, _152, _153, _154, _155, _156, _157, _158, _159, _160, _161, _162, _163, _164, _165, _166, _167, _168, _169, _170, _171, _172, _173, _174, _175, _176, _177, _178, _179, _180, _181, _182, _183, _184, _185, _186, _187, _188, _189, _190, _191, _192, _193, _194, _195, _196, _197, _198, _199, _200, _201, _202, _203, _204, _205, _206, _207, _208, _209, _210, _211, _212, _213, _214, _215, _216, _217, _218, _219, _220, _221, _222, _223, _224;
        return __generator(this, function (_225) {
            switch (_225.label) {
                case 0:
                    _225.trys.push([0, 59, , 60]);
                    ClientAndServerExecution = {
                        "Data": {
                            "total_llm_calls": 0,
                            "total_tokens": 0,
                            "total_input_tokens": 0,
                            "total_output_tokens": 0,
                            "final_llm_response": null,
                            "llm_responses_arr": [],
                            "messages": [],
                            "output_type": "text",
                            "executed_tool_calls": []
                        },
                        "Error": null,
                        "Status": false
                    };
                    selected_server_credentials = payload === null || payload === void 0 ? void 0 : payload.selected_server_credentials;
                    client_details = payload === null || payload === void 0 ? void 0 : payload.client_details;
                    selected_client = (payload === null || payload === void 0 ? void 0 : payload.selected_client) || "";
                    selected_server = ((_25 = payload === null || payload === void 0 ? void 0 : payload.selected_servers) === null || _25 === void 0 ? void 0 : _25[0]) || "";
                    if (client_details === null || client_details === void 0 ? void 0 : client_details.chat_history) {
                        client_details.chat_history.push({
                            "role": "user",
                            "content": (client_details === null || client_details === void 0 ? void 0 : client_details.input) || ""
                        });
                    }
                    else {
                        client_details["chat_history"] = [{
                                "role": "user",
                                "content": (client_details === null || client_details === void 0 ? void 0 : client_details.input) || ""
                            }];
                    }
                    temp_tools = JSON.stringify(client_details === null || client_details === void 0 ? void 0 : client_details.tools);
                    temp_prompt = "".concat(client_details === null || client_details === void 0 ? void 0 : client_details.prompt);
                    tool_call_details_arr = [];
                    for (_i = 0, _a = (client_details === null || client_details === void 0 ? void 0 : client_details.tools) || []; _i < _a.length; _i++) {
                        tool = _a[_i];
                        tool_call_details_arr.push({
                            "function_name": ((_26 = tool === null || tool === void 0 ? void 0 : tool.function) === null || _26 === void 0 ? void 0 : _26.name) || "",
                            "function_description": ((_27 = tool === null || tool === void 0 ? void 0 : tool.function) === null || _27 === void 0 ? void 0 : _27.description) || "",
                        });
                    }
                    tools_getting_agent_prompt = "\n        You are an ".concat(selected_server, " AI assistant that analyzes user requests and determines the require tool calls from available tools.\n        Available tools: ").concat(JSON.stringify(tool_call_details_arr), "\n        Analyze each request to determine if it matches available tool capabilities or needs clarification.\n        Return TRUE for tool calls when the request clearly maps to available tools without checking the required parameters.\n        Return FALSE when the request is ambiguous, missing parameters, or requires more information.\n        Output format:\n            <function_call>TRUE/FALSE</function_call>\n            <selected_tools>function_name1,function_name2 or \"none\"</selected_tools>\n        Use exact tool names from available tools. List all relevant tools ordered by relevance.The output format should be exactly the same as mentioned above.It should be in string\n        ");
                    client_details.prompt = tools_getting_agent_prompt;
                    client_details.tools = [];
                    if (!(selected_client == "MCP_CLIENT_AZURE_AI")) return [3 /*break*/, 19];
                    return [4 /*yield*/, (0, azure_openai_js_1.AzureOpenAIProcessor)(client_details)];
                case 1:
                    initialLlmResponse = _225.sent();
                    if (initialLlmResponse.Status == false) {
                        if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                            streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: initialLlmResponse.Error, Error: ((_28 = initialLlmResponse === null || initialLlmResponse === void 0 ? void 0 : initialLlmResponse.Error) === null || _28 === void 0 ? void 0 : _28.message) || (initialLlmResponse === null || initialLlmResponse === void 0 ? void 0 : initialLlmResponse.Error), Status: false, StreamingStatus: "ERROR", Action: "ERROR" }));
                            return [2 /*return*/, ClientAndServerExecution];
                        }
                        ClientAndServerExecution.Error = ((_29 = initialLlmResponse === null || initialLlmResponse === void 0 ? void 0 : initialLlmResponse.Error) === null || _29 === void 0 ? void 0 : _29.message) || (initialLlmResponse === null || initialLlmResponse === void 0 ? void 0 : initialLlmResponse.Error);
                        ClientAndServerExecution.Status = false;
                        return [2 /*return*/, ClientAndServerExecution];
                    }
                    extractedResult = extractDataFromResponse(((_31 = (_30 = initialLlmResponse.Data) === null || _30 === void 0 ? void 0 : _30.messages) === null || _31 === void 0 ? void 0 : _31[0]) || "");
                    ClientAndServerExecution.Data.total_llm_calls += 1;
                    ClientAndServerExecution.Data.total_tokens += ((_32 = initialLlmResponse.Data) === null || _32 === void 0 ? void 0 : _32.total_tokens) || 0;
                    ClientAndServerExecution.Data.total_input_tokens += ((_33 = initialLlmResponse.Data) === null || _33 === void 0 ? void 0 : _33.total_input_tokens) || 0;
                    ClientAndServerExecution.Data.total_output_tokens += ((_34 = initialLlmResponse.Data) === null || _34 === void 0 ? void 0 : _34.total_output_tokens) || 0;
                    ClientAndServerExecution.Data.final_llm_response = (_35 = initialLlmResponse.Data) === null || _35 === void 0 ? void 0 : _35.final_llm_response;
                    ClientAndServerExecution.Data.llm_responses_arr.push((_36 = initialLlmResponse.Data) === null || _36 === void 0 ? void 0 : _36.final_llm_response);
                    if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                        streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: "Optimized Token LLM call Successfully Completed", Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "NOTIFICATION" }));
                    }
                    if (!extractedResult.isFunctionCall) return [3 /*break*/, 9];
                    final_tool_calls = [];
                    _loop_1 = function (tool_name) {
                        var parsedTools = JSON.parse(temp_tools) || [];
                        var matchingTool = parsedTools.find(function (temp_tool) { var _a; return ((_a = temp_tool === null || temp_tool === void 0 ? void 0 : temp_tool.function) === null || _a === void 0 ? void 0 : _a.name) == tool_name; });
                        if (matchingTool) {
                            final_tool_calls.push(matchingTool);
                        }
                    };
                    for (_b = 0, _c = extractedResult.selectedTools; _b < _c.length; _b++) {
                        tool_name = _c[_b];
                        _loop_1(tool_name);
                    }
                    client_details.prompt = temp_prompt;
                    client_details.tools = final_tool_calls;
                    _225.label = 2;
                case 2:
                    if (!true) return [3 /*break*/, 8];
                    return [4 /*yield*/, (0, azure_openai_js_1.AzureOpenAIProcessor)(client_details)];
                case 3:
                    response = _225.sent();
                    if (!response.Status) {
                        ClientAndServerExecution.Error = response.Error;
                        ClientAndServerExecution.Status = response.Status;
                        return [2 /*return*/, ClientAndServerExecution];
                    }
                    ClientAndServerExecution.Data.total_llm_calls += 1;
                    ClientAndServerExecution.Data.total_tokens += ((_37 = response.Data) === null || _37 === void 0 ? void 0 : _37.total_tokens) || 0;
                    ClientAndServerExecution.Data.total_input_tokens += ((_38 = response.Data) === null || _38 === void 0 ? void 0 : _38.total_input_tokens) || 0;
                    ClientAndServerExecution.Data.total_output_tokens += ((_39 = response.Data) === null || _39 === void 0 ? void 0 : _39.total_output_tokens) || 0;
                    ClientAndServerExecution.Data.final_llm_response = (_40 = response.Data) === null || _40 === void 0 ? void 0 : _40.final_llm_response;
                    ClientAndServerExecution.Data.llm_responses_arr.push((_41 = response.Data) === null || _41 === void 0 ? void 0 : _41.final_llm_response);
                    if (((_42 = response.Data) === null || _42 === void 0 ? void 0 : _42.output_type) == "text") {
                        (_19 = ClientAndServerExecution.Data.messages).push.apply(_19, (_43 = response.Data) === null || _43 === void 0 ? void 0 : _43.messages);
                        ClientAndServerExecution.Data.output_type = ((_44 = response.Data) === null || _44 === void 0 ? void 0 : _44.output_type) || "";
                        ClientAndServerExecution.Error = response.Error;
                        ClientAndServerExecution.Status = response.Status;
                        for (_d = 0, _e = ((_45 = response.Data) === null || _45 === void 0 ? void 0 : _45.messages) || []; _d < _e.length; _d++) {
                            message = _e[_d];
                            if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                                streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: message, Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "MESSAGE" }));
                            }
                        }
                        return [2 /*return*/, ClientAndServerExecution];
                    }
                    if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                        streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: "Tool Calls Started", Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "NOTIFICATION" }));
                    }
                    _f = 0, _g = ((_50 = (_49 = (_48 = (_47 = (_46 = response.Data) === null || _46 === void 0 ? void 0 : _46.final_llm_response) === null || _47 === void 0 ? void 0 : _47.choices) === null || _48 === void 0 ? void 0 : _48[0]) === null || _49 === void 0 ? void 0 : _49.message) === null || _50 === void 0 ? void 0 : _50.tool_calls) || [];
                    _225.label = 4;
                case 4:
                    if (!(_f < _g.length)) return [3 /*break*/, 7];
                    tool = _g[_f];
                    toolName = (_51 = tool === null || tool === void 0 ? void 0 : tool.function) === null || _51 === void 0 ? void 0 : _51.name;
                    args = JSON.parse((_52 = tool === null || tool === void 0 ? void 0 : tool.function) === null || _52 === void 0 ? void 0 : _52.arguments);
                    if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                        streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: "".concat(selected_server, " MCP server ").concat(toolName, " call initiated"), Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "NOTIFICATION" }));
                    }
                    return [4 /*yield*/, CallAndExecuteTool(selected_server, selected_server_credentials, toolName, args)];
                case 5:
                    tool_call_result = _225.sent();
                    if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                        streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: "".concat(selected_server, " MCP server ").concat(toolName, " call result  : ").concat(JSON.stringify(tool_call_result)), Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "NOTIFICATION" }));
                    }
                    ClientAndServerExecution.Data.executed_tool_calls.push({
                        "id": tool === null || tool === void 0 ? void 0 : tool.id,
                        "name": toolName,
                        "arguments": args,
                        "result": tool_call_result,
                    });
                    tool_call_content_data = "Calling tool: ".concat(toolName, " with arguments: ").concat(JSON.stringify(args), " and result: ").concat(JSON.stringify(tool_call_result));
                    client_details.chat_history.push({
                        "role": "assistant",
                        "content": tool_call_content_data,
                    });
                    _225.label = 6;
                case 6:
                    _f++;
                    return [3 /*break*/, 4];
                case 7: return [3 /*break*/, 2];
                case 8: return [3 /*break*/, 18];
                case 9:
                    client_details.prompt = "".concat(temp_prompt, ". Available tools: ").concat(JSON.stringify(tool_call_details_arr));
                    client_details.tools = [];
                    return [4 /*yield*/, (0, azure_openai_js_1.AzureOpenAIProcessor)(client_details)];
                case 10:
                    normalResponse = _225.sent();
                    ClientAndServerExecution.Data.total_llm_calls += 1;
                    ClientAndServerExecution.Data.total_tokens += ((_53 = normalResponse.Data) === null || _53 === void 0 ? void 0 : _53.total_tokens) || 0;
                    ClientAndServerExecution.Data.total_input_tokens += ((_54 = normalResponse.Data) === null || _54 === void 0 ? void 0 : _54.total_input_tokens) || 0;
                    ClientAndServerExecution.Data.total_output_tokens += ((_55 = normalResponse.Data) === null || _55 === void 0 ? void 0 : _55.total_output_tokens) || 0;
                    ClientAndServerExecution.Data.final_llm_response = (_56 = normalResponse.Data) === null || _56 === void 0 ? void 0 : _56.final_llm_response;
                    ClientAndServerExecution.Data.llm_responses_arr.push((_57 = normalResponse.Data) === null || _57 === void 0 ? void 0 : _57.final_llm_response);
                    ClientAndServerExecution.Data.output_type = ((_58 = normalResponse.Data) === null || _58 === void 0 ? void 0 : _58.output_type) || "";
                    ClientAndServerExecution.Error = normalResponse.Error;
                    ClientAndServerExecution.Status = normalResponse.Status;
                    if (!normalResponse.Status || (((_63 = (_62 = (_61 = (_60 = (_59 = normalResponse.Data) === null || _59 === void 0 ? void 0 : _59.final_llm_response) === null || _60 === void 0 ? void 0 : _60.choices) === null || _61 === void 0 ? void 0 : _61[0]) === null || _62 === void 0 ? void 0 : _62.message) === null || _63 === void 0 ? void 0 : _63.content) != null && ((_68 = (_67 = (_66 = (_65 = (_64 = normalResponse.Data) === null || _64 === void 0 ? void 0 : _64.final_llm_response) === null || _65 === void 0 ? void 0 : _65.choices) === null || _66 === void 0 ? void 0 : _66[0]) === null || _67 === void 0 ? void 0 : _67.message) === null || _68 === void 0 ? void 0 : _68.content) != "")) {
                        ClientAndServerExecution.Data.messages = ((_69 = normalResponse.Data) === null || _69 === void 0 ? void 0 : _69.messages) || [];
                        for (_h = 0, _j = ((_70 = normalResponse.Data) === null || _70 === void 0 ? void 0 : _70.messages) || []; _h < _j.length; _h++) {
                            message = _j[_h];
                            if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                                streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: message, Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "MESSAGE" }));
                            }
                        }
                        return [2 /*return*/, ClientAndServerExecution];
                    }
                    if (!((((_75 = (_74 = (_73 = (_72 = (_71 = normalResponse.Data) === null || _71 === void 0 ? void 0 : _71.final_llm_response) === null || _72 === void 0 ? void 0 : _72.choices) === null || _73 === void 0 ? void 0 : _73[0]) === null || _74 === void 0 ? void 0 : _74.message) === null || _75 === void 0 ? void 0 : _75.tool_calls) || []).length > 0)) return [3 /*break*/, 17];
                    final_tool_calls = [];
                    _loop_2 = function (tool_name) {
                        var parsedTools = JSON.parse(temp_tools) || [];
                        var matchingTool = parsedTools.find(function (temp_tool) { var _a; return ((_a = temp_tool === null || temp_tool === void 0 ? void 0 : temp_tool.function) === null || _a === void 0 ? void 0 : _a.name) == tool_name; });
                        if (matchingTool) {
                            final_tool_calls.push(matchingTool);
                        }
                    };
                    for (_k = 0, _l = extractedResult.selectedTools; _k < _l.length; _k++) {
                        tool_name = _l[_k];
                        _loop_2(tool_name);
                    }
                    client_details.prompt = temp_prompt;
                    client_details.tools = final_tool_calls;
                    _225.label = 11;
                case 11:
                    if (!true) return [3 /*break*/, 17];
                    return [4 /*yield*/, (0, azure_openai_js_1.AzureOpenAIProcessor)(client_details)];
                case 12:
                    response = _225.sent();
                    if (!response.Status) {
                        ClientAndServerExecution.Error = response.Error;
                        ClientAndServerExecution.Status = response.Status;
                        return [2 /*return*/, ClientAndServerExecution];
                    }
                    ClientAndServerExecution.Data.total_llm_calls += 1;
                    ClientAndServerExecution.Data.total_tokens += ((_76 = response.Data) === null || _76 === void 0 ? void 0 : _76.total_tokens) || 0;
                    ClientAndServerExecution.Data.total_input_tokens += ((_77 = response.Data) === null || _77 === void 0 ? void 0 : _77.total_input_tokens) || 0;
                    ClientAndServerExecution.Data.total_output_tokens += ((_78 = response.Data) === null || _78 === void 0 ? void 0 : _78.total_output_tokens) || 0;
                    ClientAndServerExecution.Data.final_llm_response = (_79 = response.Data) === null || _79 === void 0 ? void 0 : _79.final_llm_response;
                    ClientAndServerExecution.Data.llm_responses_arr.push((_80 = response.Data) === null || _80 === void 0 ? void 0 : _80.final_llm_response);
                    if (((_81 = response.Data) === null || _81 === void 0 ? void 0 : _81.output_type) == "text") {
                        (_20 = ClientAndServerExecution.Data.messages).push.apply(_20, (_82 = response.Data) === null || _82 === void 0 ? void 0 : _82.messages);
                        ClientAndServerExecution.Data.output_type = ((_83 = response.Data) === null || _83 === void 0 ? void 0 : _83.output_type) || "";
                        ClientAndServerExecution.Error = response.Error;
                        ClientAndServerExecution.Status = response.Status;
                        for (_m = 0, _o = ((_84 = response.Data) === null || _84 === void 0 ? void 0 : _84.messages) || []; _m < _o.length; _m++) {
                            message = _o[_m];
                            if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                                streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: message, Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "MESSAGE" }));
                            }
                        }
                        return [2 /*return*/, ClientAndServerExecution];
                    }
                    if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                        streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: "Tool Calls Started", Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "NOTIFICATION" }));
                    }
                    _p = 0, _q = ((_89 = (_88 = (_87 = (_86 = (_85 = response.Data) === null || _85 === void 0 ? void 0 : _85.final_llm_response) === null || _86 === void 0 ? void 0 : _86.choices) === null || _87 === void 0 ? void 0 : _87[0]) === null || _88 === void 0 ? void 0 : _88.message) === null || _89 === void 0 ? void 0 : _89.tool_calls) || [];
                    _225.label = 13;
                case 13:
                    if (!(_p < _q.length)) return [3 /*break*/, 16];
                    tool = _q[_p];
                    toolName = (_90 = tool === null || tool === void 0 ? void 0 : tool.function) === null || _90 === void 0 ? void 0 : _90.name;
                    args = JSON.parse((_91 = tool === null || tool === void 0 ? void 0 : tool.function) === null || _91 === void 0 ? void 0 : _91.arguments);
                    if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                        streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: "".concat(selected_server, " MCP server ").concat(toolName, " call initiated"), Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "NOTIFICATION" }));
                    }
                    return [4 /*yield*/, CallAndExecuteTool(selected_server, selected_server_credentials, toolName, args)];
                case 14:
                    tool_call_result = _225.sent();
                    if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                        streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: "".concat(selected_server, " MCP server ").concat(toolName, " call result  : ").concat(JSON.stringify(tool_call_result)), Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "NOTIFICATION" }));
                    }
                    ClientAndServerExecution.Data.executed_tool_calls.push({
                        "id": tool === null || tool === void 0 ? void 0 : tool.id,
                        "name": toolName,
                        "arguments": args,
                        "result": tool_call_result,
                    });
                    tool_call_content_data = "Calling tool: ".concat(toolName, " with arguments: ").concat(JSON.stringify(args), " and result: ").concat(JSON.stringify(tool_call_result));
                    client_details.chat_history.push({
                        "role": "assistant",
                        "content": tool_call_content_data,
                    });
                    _225.label = 15;
                case 15:
                    _p++;
                    return [3 /*break*/, 13];
                case 16: return [3 /*break*/, 11];
                case 17: return [2 /*return*/, ClientAndServerExecution];
                case 18: return [3 /*break*/, 58];
                case 19:
                    if (!(selected_client == "MCP_CLIENT_GEMINI")) return [3 /*break*/, 38];
                    return [4 /*yield*/, (0, gemini_js_1.GeminiProcessor)(client_details)];
                case 20:
                    initialLlmResponse = _225.sent();
                    if (initialLlmResponse.Status == false) {
                        if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                            streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: initialLlmResponse.Error, Error: ((_92 = initialLlmResponse === null || initialLlmResponse === void 0 ? void 0 : initialLlmResponse.Error) === null || _92 === void 0 ? void 0 : _92.message) || (initialLlmResponse === null || initialLlmResponse === void 0 ? void 0 : initialLlmResponse.Error), Status: false, StreamingStatus: "ERROR", Action: "ERROR" }));
                            return [2 /*return*/, ClientAndServerExecution];
                        }
                        ClientAndServerExecution.Error = ((_93 = initialLlmResponse === null || initialLlmResponse === void 0 ? void 0 : initialLlmResponse.Error) === null || _93 === void 0 ? void 0 : _93.message) || (initialLlmResponse === null || initialLlmResponse === void 0 ? void 0 : initialLlmResponse.Error);
                        ClientAndServerExecution.Status = false;
                        return [2 /*return*/, ClientAndServerExecution];
                    }
                    extractedResult = extractDataFromResponse(((_95 = (_94 = initialLlmResponse.Data) === null || _94 === void 0 ? void 0 : _94.messages) === null || _95 === void 0 ? void 0 : _95[0]) || "");
                    ClientAndServerExecution.Data.total_llm_calls += 1;
                    ClientAndServerExecution.Data.total_tokens += ((_96 = initialLlmResponse.Data) === null || _96 === void 0 ? void 0 : _96.total_tokens) || 0;
                    ClientAndServerExecution.Data.total_input_tokens += ((_97 = initialLlmResponse.Data) === null || _97 === void 0 ? void 0 : _97.total_input_tokens) || 0;
                    ClientAndServerExecution.Data.total_output_tokens += ((_98 = initialLlmResponse.Data) === null || _98 === void 0 ? void 0 : _98.total_output_tokens) || 0;
                    ClientAndServerExecution.Data.final_llm_response = (_99 = initialLlmResponse.Data) === null || _99 === void 0 ? void 0 : _99.final_llm_response;
                    ClientAndServerExecution.Data.llm_responses_arr.push((_100 = initialLlmResponse.Data) === null || _100 === void 0 ? void 0 : _100.final_llm_response);
                    if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                        streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: "Optimized Token LLM call Successfully Completed", Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "NOTIFICATION" }));
                    }
                    if (!extractedResult.isFunctionCall) return [3 /*break*/, 28];
                    final_tool_calls = [];
                    _loop_3 = function (tool_name) {
                        var parsedTools = JSON.parse(temp_tools) || [];
                        var matchingTool = parsedTools.find(function (temp_tool) { var _a; return ((_a = temp_tool === null || temp_tool === void 0 ? void 0 : temp_tool.function) === null || _a === void 0 ? void 0 : _a.name) == tool_name; });
                        if (matchingTool) {
                            final_tool_calls.push(matchingTool);
                        }
                    };
                    for (_r = 0, _s = extractedResult.selectedTools; _r < _s.length; _r++) {
                        tool_name = _s[_r];
                        _loop_3(tool_name);
                    }
                    client_details.prompt = temp_prompt;
                    client_details.tools = final_tool_calls;
                    _225.label = 21;
                case 21:
                    if (!true) return [3 /*break*/, 27];
                    return [4 /*yield*/, (0, gemini_js_1.GeminiProcessor)(client_details)];
                case 22:
                    response = _225.sent();
                    if (!response.Status) {
                        ClientAndServerExecution.Error = response.Error;
                        ClientAndServerExecution.Status = response.Status;
                        return [2 /*return*/, ClientAndServerExecution];
                    }
                    ClientAndServerExecution.Data.total_llm_calls += 1;
                    ClientAndServerExecution.Data.total_tokens += ((_101 = response.Data) === null || _101 === void 0 ? void 0 : _101.total_tokens) || 0;
                    ClientAndServerExecution.Data.total_input_tokens += ((_102 = response.Data) === null || _102 === void 0 ? void 0 : _102.total_input_tokens) || 0;
                    ClientAndServerExecution.Data.total_output_tokens += ((_103 = response.Data) === null || _103 === void 0 ? void 0 : _103.total_output_tokens) || 0;
                    ClientAndServerExecution.Data.final_llm_response = (_104 = response.Data) === null || _104 === void 0 ? void 0 : _104.final_llm_response;
                    ClientAndServerExecution.Data.llm_responses_arr.push((_105 = response.Data) === null || _105 === void 0 ? void 0 : _105.final_llm_response);
                    if (((_106 = response.Data) === null || _106 === void 0 ? void 0 : _106.output_type) == "text") {
                        (_21 = ClientAndServerExecution.Data.messages).push.apply(_21, (_107 = response.Data) === null || _107 === void 0 ? void 0 : _107.messages);
                        ClientAndServerExecution.Data.output_type = ((_108 = response.Data) === null || _108 === void 0 ? void 0 : _108.output_type) || "";
                        ClientAndServerExecution.Error = response.Error;
                        ClientAndServerExecution.Status = response.Status;
                        for (_t = 0, _u = ((_109 = response.Data) === null || _109 === void 0 ? void 0 : _109.messages) || []; _t < _u.length; _t++) {
                            message = _u[_t];
                            if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                                streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: message, Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "MESSAGE" }));
                            }
                        }
                        return [2 /*return*/, ClientAndServerExecution];
                    }
                    if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                        streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: "Tool Calls Started", Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "NOTIFICATION" }));
                    }
                    _v = 0, _w = ((_114 = (_113 = (_112 = (_111 = (_110 = response.Data) === null || _110 === void 0 ? void 0 : _110.final_llm_response) === null || _111 === void 0 ? void 0 : _111.candidates) === null || _112 === void 0 ? void 0 : _112[0]) === null || _113 === void 0 ? void 0 : _113.content) === null || _114 === void 0 ? void 0 : _114.parts) || [];
                    _225.label = 23;
                case 23:
                    if (!(_v < _w.length)) return [3 /*break*/, 26];
                    part = _w[_v];
                    toolName = (_115 = part === null || part === void 0 ? void 0 : part.functionCall) === null || _115 === void 0 ? void 0 : _115.name;
                    args = (_116 = part === null || part === void 0 ? void 0 : part.functionCall) === null || _116 === void 0 ? void 0 : _116.args;
                    if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                        streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({
                            Data: "".concat(selected_server, " MCP server ").concat(toolName, " call initiated"),
                            Error: null,
                            Status: true,
                            StreamingStatus: "IN-PROGRESS",
                            Action: "NOTIFICATION"
                        }));
                    }
                    return [4 /*yield*/, CallAndExecuteTool(selected_server, selected_server_credentials, toolName, args)];
                case 24:
                    tool_call_result_1 = _225.sent();
                    if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                        streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({
                            Data: "".concat(selected_server, " MCP server ").concat(toolName, " call result  : ").concat(JSON.stringify(tool_call_result_1)),
                            Error: null,
                            Status: true,
                            StreamingStatus: "IN-PROGRESS",
                            Action: "NOTIFICATION"
                        }));
                    }
                    ClientAndServerExecution.Data.executed_tool_calls.push({
                        name: toolName,
                        arguments: args,
                        result: tool_call_result_1,
                    });
                    tool_call_content_data = "Calling tool: ".concat(toolName, " with arguments: ").concat(JSON.stringify(args), " and result: ").concat(JSON.stringify(tool_call_result_1));
                    client_details.chat_history.push({
                        role: "model",
                        content: tool_call_content_data,
                    });
                    _225.label = 25;
                case 25:
                    _v++;
                    return [3 /*break*/, 23];
                case 26: return [3 /*break*/, 21];
                case 27: return [3 /*break*/, 37];
                case 28:
                    client_details.prompt = "".concat(temp_prompt, ". Available tools: ").concat(JSON.stringify(tool_call_details_arr));
                    client_details.tools = [];
                    return [4 /*yield*/, (0, gemini_js_1.GeminiProcessor)(client_details)];
                case 29:
                    normalResponse = _225.sent();
                    ClientAndServerExecution.Data.total_llm_calls += 1;
                    ClientAndServerExecution.Data.total_tokens += ((_117 = normalResponse.Data) === null || _117 === void 0 ? void 0 : _117.total_tokens) || 0;
                    ClientAndServerExecution.Data.total_input_tokens += ((_118 = normalResponse.Data) === null || _118 === void 0 ? void 0 : _118.total_input_tokens) || 0;
                    ClientAndServerExecution.Data.total_output_tokens += ((_119 = normalResponse.Data) === null || _119 === void 0 ? void 0 : _119.total_output_tokens) || 0;
                    ClientAndServerExecution.Data.final_llm_response = (_120 = normalResponse.Data) === null || _120 === void 0 ? void 0 : _120.final_llm_response;
                    ClientAndServerExecution.Data.llm_responses_arr.push((_121 = normalResponse.Data) === null || _121 === void 0 ? void 0 : _121.final_llm_response);
                    ClientAndServerExecution.Data.output_type = ((_122 = normalResponse.Data) === null || _122 === void 0 ? void 0 : _122.output_type) || "";
                    ClientAndServerExecution.Error = normalResponse.Error;
                    ClientAndServerExecution.Status = normalResponse.Status;
                    if (!normalResponse.Status || (((_129 = (_128 = (_127 = (_126 = (_125 = (_124 = (_123 = normalResponse.Data) === null || _123 === void 0 ? void 0 : _123.final_llm_response) === null || _124 === void 0 ? void 0 : _124.candidates) === null || _125 === void 0 ? void 0 : _125[0]) === null || _126 === void 0 ? void 0 : _126.content) === null || _127 === void 0 ? void 0 : _127.parts) === null || _128 === void 0 ? void 0 : _128[0]) === null || _129 === void 0 ? void 0 : _129.text) != null && ((_136 = (_135 = (_134 = (_133 = (_132 = (_131 = (_130 = normalResponse.Data) === null || _130 === void 0 ? void 0 : _130.final_llm_response) === null || _131 === void 0 ? void 0 : _131.candidates) === null || _132 === void 0 ? void 0 : _132[0]) === null || _133 === void 0 ? void 0 : _133.content) === null || _134 === void 0 ? void 0 : _134.parts) === null || _135 === void 0 ? void 0 : _135[0]) === null || _136 === void 0 ? void 0 : _136.text) != "")) {
                        ClientAndServerExecution.Data.messages = ((_137 = normalResponse.Data) === null || _137 === void 0 ? void 0 : _137.messages) || [];
                        for (_x = 0, _y = ((_138 = normalResponse.Data) === null || _138 === void 0 ? void 0 : _138.messages) || []; _x < _y.length; _x++) {
                            message = _y[_x];
                            if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                                streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: message, Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "MESSAGE" }));
                            }
                        }
                        return [2 /*return*/, ClientAndServerExecution];
                    }
                    if (!((((_144 = (_143 = (_142 = (_141 = (_140 = (_139 = normalResponse.Data) === null || _139 === void 0 ? void 0 : _139.final_llm_response) === null || _140 === void 0 ? void 0 : _140.candidates) === null || _141 === void 0 ? void 0 : _141[0]) === null || _142 === void 0 ? void 0 : _142.content) === null || _143 === void 0 ? void 0 : _143.parts[0]) === null || _144 === void 0 ? void 0 : _144.functionCall) || []).length > 0)) return [3 /*break*/, 36];
                    final_tool_calls = [];
                    _loop_4 = function (tool_name) {
                        var parsedTools = JSON.parse(temp_tools) || [];
                        var matchingTool = parsedTools.find(function (temp_tool) { var _a; return ((_a = temp_tool === null || temp_tool === void 0 ? void 0 : temp_tool.function) === null || _a === void 0 ? void 0 : _a.name) == tool_name; });
                        if (matchingTool) {
                            final_tool_calls.push(matchingTool);
                        }
                    };
                    for (_z = 0, _0 = extractedResult.selectedTools; _z < _0.length; _z++) {
                        tool_name = _0[_z];
                        _loop_4(tool_name);
                    }
                    client_details.prompt = temp_prompt;
                    client_details.tools = final_tool_calls;
                    _225.label = 30;
                case 30:
                    if (!true) return [3 /*break*/, 36];
                    return [4 /*yield*/, (0, gemini_js_1.GeminiProcessor)(client_details)];
                case 31:
                    response = _225.sent();
                    if (!response.Status) {
                        ClientAndServerExecution.Error = response.Error;
                        ClientAndServerExecution.Status = response.Status;
                        return [2 /*return*/, ClientAndServerExecution];
                    }
                    ClientAndServerExecution.Data.total_llm_calls += 1;
                    ClientAndServerExecution.Data.total_tokens += ((_145 = response.Data) === null || _145 === void 0 ? void 0 : _145.total_tokens) || 0;
                    ClientAndServerExecution.Data.total_input_tokens += ((_146 = response.Data) === null || _146 === void 0 ? void 0 : _146.total_input_tokens) || 0;
                    ClientAndServerExecution.Data.total_output_tokens += ((_147 = response.Data) === null || _147 === void 0 ? void 0 : _147.total_output_tokens) || 0;
                    ClientAndServerExecution.Data.final_llm_response = (_148 = response.Data) === null || _148 === void 0 ? void 0 : _148.final_llm_response;
                    ClientAndServerExecution.Data.llm_responses_arr.push((_149 = response.Data) === null || _149 === void 0 ? void 0 : _149.final_llm_response);
                    if (((_150 = response.Data) === null || _150 === void 0 ? void 0 : _150.output_type) == "text") {
                        (_22 = ClientAndServerExecution.Data.messages).push.apply(_22, (_151 = response.Data) === null || _151 === void 0 ? void 0 : _151.messages);
                        ClientAndServerExecution.Data.output_type = ((_152 = response.Data) === null || _152 === void 0 ? void 0 : _152.output_type) || "";
                        ClientAndServerExecution.Error = response.Error;
                        ClientAndServerExecution.Status = response.Status;
                        for (_1 = 0, _2 = ((_153 = response.Data) === null || _153 === void 0 ? void 0 : _153.messages) || []; _1 < _2.length; _1++) {
                            message = _2[_1];
                            if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                                streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: message, Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "MESSAGE" }));
                            }
                        }
                        return [2 /*return*/, ClientAndServerExecution];
                    }
                    if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                        streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: "Tool Calls Started", Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "NOTIFICATION" }));
                    }
                    _3 = 0, _4 = ((_158 = (_157 = (_156 = (_155 = (_154 = response.Data) === null || _154 === void 0 ? void 0 : _154.final_llm_response) === null || _155 === void 0 ? void 0 : _155.candidates) === null || _156 === void 0 ? void 0 : _156[0]) === null || _157 === void 0 ? void 0 : _157.content) === null || _158 === void 0 ? void 0 : _158.parts) || [];
                    _225.label = 32;
                case 32:
                    if (!(_3 < _4.length)) return [3 /*break*/, 35];
                    part = _4[_3];
                    toolName = (_159 = part === null || part === void 0 ? void 0 : part.functionCall) === null || _159 === void 0 ? void 0 : _159.name;
                    args = (_160 = part === null || part === void 0 ? void 0 : part.functionCall) === null || _160 === void 0 ? void 0 : _160.args;
                    if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                        streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({
                            Data: "".concat(selected_server, " MCP server ").concat(toolName, " call initiated"),
                            Error: null,
                            Status: true,
                            StreamingStatus: "IN-PROGRESS",
                            Action: "NOTIFICATION"
                        }));
                    }
                    return [4 /*yield*/, CallAndExecuteTool(selected_server, selected_server_credentials, toolName, args)];
                case 33:
                    tool_call_result_2 = _225.sent();
                    if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                        streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({
                            Data: "".concat(selected_server, " MCP server ").concat(toolName, " call result  : ").concat(JSON.stringify(tool_call_result_2)),
                            Error: null,
                            Status: true,
                            StreamingStatus: "IN-PROGRESS",
                            Action: "NOTIFICATION"
                        }));
                    }
                    ClientAndServerExecution.Data.executed_tool_calls.push({
                        name: toolName,
                        arguments: args,
                        result: tool_call_result_2,
                    });
                    tool_call_content_data = "Calling tool: ".concat(toolName, " with arguments: ").concat(JSON.stringify(args), " and result: ").concat(JSON.stringify(tool_call_result_2));
                    client_details.chat_history.push({
                        role: "model",
                        content: tool_call_content_data,
                    });
                    _225.label = 34;
                case 34:
                    _3++;
                    return [3 /*break*/, 32];
                case 35: return [3 /*break*/, 30];
                case 36: return [2 /*return*/, ClientAndServerExecution];
                case 37: return [3 /*break*/, 58];
                case 38:
                    if (!(selected_client == "MCP_CLIENT_OPENAI")) return [3 /*break*/, 57];
                    return [4 /*yield*/, (0, openai_js_1.OpenAIProcessor)(client_details)];
                case 39:
                    initialLlmResponse = _225.sent();
                    if (initialLlmResponse.Status == false) {
                        if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                            streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: initialLlmResponse.Error, Error: ((_161 = initialLlmResponse === null || initialLlmResponse === void 0 ? void 0 : initialLlmResponse.Error) === null || _161 === void 0 ? void 0 : _161.message) || (initialLlmResponse === null || initialLlmResponse === void 0 ? void 0 : initialLlmResponse.Error), Status: false, StreamingStatus: "ERROR", Action: "ERROR" }));
                            return [2 /*return*/, ClientAndServerExecution];
                        }
                        ClientAndServerExecution.Error = ((_162 = initialLlmResponse === null || initialLlmResponse === void 0 ? void 0 : initialLlmResponse.Error) === null || _162 === void 0 ? void 0 : _162.message) || (initialLlmResponse === null || initialLlmResponse === void 0 ? void 0 : initialLlmResponse.Error);
                        ClientAndServerExecution.Status = false;
                        return [2 /*return*/, ClientAndServerExecution];
                    }
                    extractedResult = extractDataFromResponse(((_164 = (_163 = initialLlmResponse.Data) === null || _163 === void 0 ? void 0 : _163.messages) === null || _164 === void 0 ? void 0 : _164[0]) || "");
                    ClientAndServerExecution.Data.total_llm_calls += 1;
                    ClientAndServerExecution.Data.total_tokens += ((_165 = initialLlmResponse.Data) === null || _165 === void 0 ? void 0 : _165.total_tokens) || 0;
                    ClientAndServerExecution.Data.total_input_tokens += ((_166 = initialLlmResponse.Data) === null || _166 === void 0 ? void 0 : _166.total_input_tokens) || 0;
                    ClientAndServerExecution.Data.total_output_tokens += ((_167 = initialLlmResponse.Data) === null || _167 === void 0 ? void 0 : _167.total_output_tokens) || 0;
                    ClientAndServerExecution.Data.final_llm_response = (_168 = initialLlmResponse.Data) === null || _168 === void 0 ? void 0 : _168.final_llm_response;
                    ClientAndServerExecution.Data.llm_responses_arr.push((_169 = initialLlmResponse.Data) === null || _169 === void 0 ? void 0 : _169.final_llm_response);
                    if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                        streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: "Optimized Token LLM call Successfully Completed", Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "NOTIFICATION" }));
                    }
                    if (!extractedResult.isFunctionCall) return [3 /*break*/, 47];
                    final_tool_calls = [];
                    _loop_5 = function (tool_name) {
                        var parsedTools = JSON.parse(temp_tools) || [];
                        var matchingTool = parsedTools.find(function (temp_tool) { var _a; return ((_a = temp_tool === null || temp_tool === void 0 ? void 0 : temp_tool.function) === null || _a === void 0 ? void 0 : _a.name) == tool_name; });
                        if (matchingTool) {
                            final_tool_calls.push(matchingTool);
                        }
                    };
                    for (_5 = 0, _6 = extractedResult.selectedTools; _5 < _6.length; _5++) {
                        tool_name = _6[_5];
                        _loop_5(tool_name);
                    }
                    client_details.prompt = temp_prompt;
                    client_details.tools = final_tool_calls;
                    _225.label = 40;
                case 40:
                    if (!true) return [3 /*break*/, 46];
                    return [4 /*yield*/, (0, openai_js_1.OpenAIProcessor)(client_details)];
                case 41:
                    response = _225.sent();
                    if (!response.Status) {
                        ClientAndServerExecution.Error = response.Error;
                        ClientAndServerExecution.Status = response.Status;
                        return [2 /*return*/, ClientAndServerExecution];
                    }
                    ClientAndServerExecution.Data.total_llm_calls += 1;
                    ClientAndServerExecution.Data.total_tokens += ((_170 = response.Data) === null || _170 === void 0 ? void 0 : _170.total_tokens) || 0;
                    ClientAndServerExecution.Data.total_input_tokens += ((_171 = response.Data) === null || _171 === void 0 ? void 0 : _171.total_input_tokens) || 0;
                    ClientAndServerExecution.Data.total_output_tokens += ((_172 = response.Data) === null || _172 === void 0 ? void 0 : _172.total_output_tokens) || 0;
                    ClientAndServerExecution.Data.final_llm_response = (_173 = response.Data) === null || _173 === void 0 ? void 0 : _173.final_llm_response;
                    ClientAndServerExecution.Data.llm_responses_arr.push((_174 = response.Data) === null || _174 === void 0 ? void 0 : _174.final_llm_response);
                    if (((_175 = response.Data) === null || _175 === void 0 ? void 0 : _175.output_type) == "text") {
                        (_23 = ClientAndServerExecution.Data.messages).push.apply(_23, (_176 = response.Data) === null || _176 === void 0 ? void 0 : _176.messages);
                        ClientAndServerExecution.Data.output_type = ((_177 = response.Data) === null || _177 === void 0 ? void 0 : _177.output_type) || "";
                        ClientAndServerExecution.Error = response.Error;
                        ClientAndServerExecution.Status = response.Status;
                        for (_7 = 0, _8 = ((_178 = response.Data) === null || _178 === void 0 ? void 0 : _178.messages) || []; _7 < _8.length; _7++) {
                            message = _8[_7];
                            if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                                streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: message, Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "MESSAGE" }));
                            }
                        }
                        return [2 /*return*/, ClientAndServerExecution];
                    }
                    if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                        streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: "Tool Calls Started", Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "NOTIFICATION" }));
                    }
                    _9 = 0, _10 = ((_183 = (_182 = (_181 = (_180 = (_179 = response.Data) === null || _179 === void 0 ? void 0 : _179.final_llm_response) === null || _180 === void 0 ? void 0 : _180.choices) === null || _181 === void 0 ? void 0 : _181[0]) === null || _182 === void 0 ? void 0 : _182.message) === null || _183 === void 0 ? void 0 : _183.tool_calls) || [];
                    _225.label = 42;
                case 42:
                    if (!(_9 < _10.length)) return [3 /*break*/, 45];
                    tool = _10[_9];
                    toolName = (_184 = tool === null || tool === void 0 ? void 0 : tool.function) === null || _184 === void 0 ? void 0 : _184.name;
                    args = JSON.parse((_185 = tool === null || tool === void 0 ? void 0 : tool.function) === null || _185 === void 0 ? void 0 : _185.arguments);
                    if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                        streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: "".concat(selected_server, " MCP server ").concat(toolName, " call initiated"), Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "NOTIFICATION" }));
                    }
                    return [4 /*yield*/, CallAndExecuteTool(selected_server, selected_server_credentials, toolName, args)];
                case 43:
                    tool_call_result = _225.sent();
                    if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                        streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: "".concat(selected_server, " MCP server ").concat(toolName, " call result  : ").concat(JSON.stringify(tool_call_result)), Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "NOTIFICATION" }));
                    }
                    ClientAndServerExecution.Data.executed_tool_calls.push({
                        "id": tool === null || tool === void 0 ? void 0 : tool.id,
                        "name": toolName,
                        "arguments": args,
                        "result": tool_call_result,
                    });
                    tool_call_content_data = "Calling tool: ".concat(toolName, " with arguments: ").concat(JSON.stringify(args), " and result: ").concat(JSON.stringify(tool_call_result));
                    client_details.chat_history.push({
                        "role": "assistant",
                        "content": tool_call_content_data,
                    });
                    _225.label = 44;
                case 44:
                    _9++;
                    return [3 /*break*/, 42];
                case 45: return [3 /*break*/, 40];
                case 46: return [3 /*break*/, 56];
                case 47:
                    client_details.prompt = "".concat(temp_prompt, ". Available tools: ").concat(JSON.stringify(tool_call_details_arr));
                    client_details.tools = [];
                    return [4 /*yield*/, (0, openai_js_1.OpenAIProcessor)(client_details)];
                case 48:
                    normalResponse = _225.sent();
                    ClientAndServerExecution.Data.total_llm_calls += 1;
                    ClientAndServerExecution.Data.total_tokens += ((_186 = normalResponse.Data) === null || _186 === void 0 ? void 0 : _186.total_tokens) || 0;
                    ClientAndServerExecution.Data.total_input_tokens += ((_187 = normalResponse.Data) === null || _187 === void 0 ? void 0 : _187.total_input_tokens) || 0;
                    ClientAndServerExecution.Data.total_output_tokens += ((_188 = normalResponse.Data) === null || _188 === void 0 ? void 0 : _188.total_output_tokens) || 0;
                    ClientAndServerExecution.Data.final_llm_response = (_189 = normalResponse.Data) === null || _189 === void 0 ? void 0 : _189.final_llm_response;
                    ClientAndServerExecution.Data.llm_responses_arr.push((_190 = normalResponse.Data) === null || _190 === void 0 ? void 0 : _190.final_llm_response);
                    ClientAndServerExecution.Data.output_type = ((_191 = normalResponse.Data) === null || _191 === void 0 ? void 0 : _191.output_type) || "";
                    ClientAndServerExecution.Error = normalResponse.Error;
                    ClientAndServerExecution.Status = normalResponse.Status;
                    if (!normalResponse.Status || (((_196 = (_195 = (_194 = (_193 = (_192 = normalResponse.Data) === null || _192 === void 0 ? void 0 : _192.final_llm_response) === null || _193 === void 0 ? void 0 : _193.choices) === null || _194 === void 0 ? void 0 : _194[0]) === null || _195 === void 0 ? void 0 : _195.message) === null || _196 === void 0 ? void 0 : _196.content) != null && ((_201 = (_200 = (_199 = (_198 = (_197 = normalResponse.Data) === null || _197 === void 0 ? void 0 : _197.final_llm_response) === null || _198 === void 0 ? void 0 : _198.choices) === null || _199 === void 0 ? void 0 : _199[0]) === null || _200 === void 0 ? void 0 : _200.message) === null || _201 === void 0 ? void 0 : _201.content) != "")) {
                        ClientAndServerExecution.Data.messages = ((_202 = normalResponse.Data) === null || _202 === void 0 ? void 0 : _202.messages) || [];
                        for (_11 = 0, _12 = ((_203 = normalResponse.Data) === null || _203 === void 0 ? void 0 : _203.messages) || []; _11 < _12.length; _11++) {
                            message = _12[_11];
                            if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                                streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: message, Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "MESSAGE" }));
                            }
                        }
                        return [2 /*return*/, ClientAndServerExecution];
                    }
                    if (!((((_208 = (_207 = (_206 = (_205 = (_204 = normalResponse.Data) === null || _204 === void 0 ? void 0 : _204.final_llm_response) === null || _205 === void 0 ? void 0 : _205.choices) === null || _206 === void 0 ? void 0 : _206[0]) === null || _207 === void 0 ? void 0 : _207.message) === null || _208 === void 0 ? void 0 : _208.tool_calls) || []).length > 0)) return [3 /*break*/, 55];
                    final_tool_calls = [];
                    _loop_6 = function (tool_name) {
                        var parsedTools = JSON.parse(temp_tools) || [];
                        var matchingTool = parsedTools.find(function (temp_tool) { var _a; return ((_a = temp_tool === null || temp_tool === void 0 ? void 0 : temp_tool.function) === null || _a === void 0 ? void 0 : _a.name) == tool_name; });
                        if (matchingTool) {
                            final_tool_calls.push(matchingTool);
                        }
                    };
                    for (_13 = 0, _14 = extractedResult.selectedTools; _13 < _14.length; _13++) {
                        tool_name = _14[_13];
                        _loop_6(tool_name);
                    }
                    client_details.prompt = temp_prompt;
                    client_details.tools = final_tool_calls;
                    _225.label = 49;
                case 49:
                    if (!true) return [3 /*break*/, 55];
                    return [4 /*yield*/, (0, openai_js_1.OpenAIProcessor)(client_details)];
                case 50:
                    response = _225.sent();
                    if (!response.Status) {
                        ClientAndServerExecution.Error = response.Error;
                        ClientAndServerExecution.Status = response.Status;
                        return [2 /*return*/, ClientAndServerExecution];
                    }
                    ClientAndServerExecution.Data.total_llm_calls += 1;
                    ClientAndServerExecution.Data.total_tokens += ((_209 = response.Data) === null || _209 === void 0 ? void 0 : _209.total_tokens) || 0;
                    ClientAndServerExecution.Data.total_input_tokens += ((_210 = response.Data) === null || _210 === void 0 ? void 0 : _210.total_input_tokens) || 0;
                    ClientAndServerExecution.Data.total_output_tokens += ((_211 = response.Data) === null || _211 === void 0 ? void 0 : _211.total_output_tokens) || 0;
                    ClientAndServerExecution.Data.final_llm_response = (_212 = response.Data) === null || _212 === void 0 ? void 0 : _212.final_llm_response;
                    ClientAndServerExecution.Data.llm_responses_arr.push((_213 = response.Data) === null || _213 === void 0 ? void 0 : _213.final_llm_response);
                    if (((_214 = response.Data) === null || _214 === void 0 ? void 0 : _214.output_type) == "text") {
                        (_24 = ClientAndServerExecution.Data.messages).push.apply(_24, (_215 = response.Data) === null || _215 === void 0 ? void 0 : _215.messages);
                        ClientAndServerExecution.Data.output_type = ((_216 = response.Data) === null || _216 === void 0 ? void 0 : _216.output_type) || "";
                        ClientAndServerExecution.Error = response.Error;
                        ClientAndServerExecution.Status = response.Status;
                        for (_15 = 0, _16 = ((_217 = response.Data) === null || _217 === void 0 ? void 0 : _217.messages) || []; _15 < _16.length; _15++) {
                            message = _16[_15];
                            if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                                streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: message, Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "MESSAGE" }));
                            }
                        }
                        return [2 /*return*/, ClientAndServerExecution];
                    }
                    if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                        streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: "Tool Calls Started", Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "NOTIFICATION" }));
                    }
                    _17 = 0, _18 = ((_222 = (_221 = (_220 = (_219 = (_218 = response.Data) === null || _218 === void 0 ? void 0 : _218.final_llm_response) === null || _219 === void 0 ? void 0 : _219.choices) === null || _220 === void 0 ? void 0 : _220[0]) === null || _221 === void 0 ? void 0 : _221.message) === null || _222 === void 0 ? void 0 : _222.tool_calls) || [];
                    _225.label = 51;
                case 51:
                    if (!(_17 < _18.length)) return [3 /*break*/, 54];
                    tool = _18[_17];
                    toolName = (_223 = tool === null || tool === void 0 ? void 0 : tool.function) === null || _223 === void 0 ? void 0 : _223.name;
                    args = JSON.parse((_224 = tool === null || tool === void 0 ? void 0 : tool.function) === null || _224 === void 0 ? void 0 : _224.arguments);
                    if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                        streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: "".concat(selected_server, " MCP server ").concat(toolName, " call initiated"), Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "NOTIFICATION" }));
                    }
                    return [4 /*yield*/, CallAndExecuteTool(selected_server, selected_server_credentials, toolName, args)];
                case 52:
                    tool_call_result = _225.sent();
                    if (streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.is_stream) {
                        streaming_callback === null || streaming_callback === void 0 ? void 0 : streaming_callback.streamCallbacks.onData(JSON.stringify({ Data: "".concat(selected_server, " MCP server ").concat(toolName, " call result  : ").concat(JSON.stringify(tool_call_result)), Error: null, Status: true, StreamingStatus: "IN-PROGRESS", Action: "NOTIFICATION" }));
                    }
                    ClientAndServerExecution.Data.executed_tool_calls.push({
                        "id": tool === null || tool === void 0 ? void 0 : tool.id,
                        "name": toolName,
                        "arguments": args,
                        "result": tool_call_result,
                    });
                    tool_call_content_data = "Calling tool: ".concat(toolName, " with arguments: ").concat(JSON.stringify(args), " and result: ").concat(JSON.stringify(tool_call_result));
                    client_details.chat_history.push({
                        "role": "assistant",
                        "content": tool_call_content_data,
                    });
                    _225.label = 53;
                case 53:
                    _17++;
                    return [3 /*break*/, 51];
                case 54: return [3 /*break*/, 49];
                case 55: return [2 /*return*/, ClientAndServerExecution];
                case 56: return [3 /*break*/, 58];
                case 57: return [2 /*return*/, {
                        "Data": null,
                        "Error": "Invalid Client",
                        "Status": false
                    }];
                case 58: return [3 /*break*/, 60];
                case 59:
                    err_1 = _225.sent();
                    console.log("Error initializing MCP ==========>>>> ", err_1);
                    return [2 /*return*/, {
                            "Data": null,
                            "Error": "".concat(err_1),
                            "Status": false
                        }];
                case 60: return [2 /*return*/];
            }
        });
    });
}
function extractDataFromResponse(responseContent) {
    // Default values
    var result = {
        isFunctionCall: false,
        selectedTools: []
    };
    try {
        // Extract function call status
        var functionCallMatch = responseContent.match(/<function_call>([^<]+)<\/function_call>/);
        if (functionCallMatch && functionCallMatch[1]) {
            result.isFunctionCall = functionCallMatch[1].trim().toUpperCase() === 'TRUE';
        }
        // Extract selected tools
        var selectedToolsMatch = responseContent.match(/<selected_tools>([^<]+)<\/selected_tools>/);
        if (selectedToolsMatch && selectedToolsMatch[1]) {
            // Split by comma and trim each tool name
            result.selectedTools = selectedToolsMatch[1].split(',').map(function (tool) { return tool.trim(); }).filter(function (tool) { return tool.length > 0; });
        }
    }
    catch (error) {
        console.error('Error parsing response content:', error);
    }
    return result;
}
function CallAndExecuteTool(selected_server, server_credentials, tool_name, args) {
    return __awaiter(this, void 0, void 0, function () {
        var tool_call_result, confluenceCreds, xCredentials, dropboxCreds, airtableCreds, shopifyCreds, err_2;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11;
        return __generator(this, function (_12) {
            switch (_12.label) {
                case 0:
                    switch (selected_server) {
                        case "CONFLUENCE":
                            confluenceCreds = ((_a = server_credentials[selected_server]) === null || _a === void 0 ? void 0 : _a.credentials) || server_credentials[selected_server] || {};
                            args["__credentials__"] = {
                                "api_token": confluenceCreds.api_token || "",
                                "user_email": confluenceCreds.user_email || "",
                                "base_url": confluenceCreds.base_url || ""
                            };
                            break;
                        case "WORDPRESS":
                            args.siteUrl = ((_b = server_credentials[selected_server]) === null || _b === void 0 ? void 0 : _b.siteUrl) || "";
                            args.username = ((_c = server_credentials[selected_server]) === null || _c === void 0 ? void 0 : _c.username) || "";
                            args.password = ((_d = server_credentials[selected_server]) === null || _d === void 0 ? void 0 : _d.password) || "";
                            break;
                        case "ZOOMMCP":
                            args["__credentials__"] = {
                                "account_id": ((_e = server_credentials[selected_server]) === null || _e === void 0 ? void 0 : _e.account_id) || "",
                                "client_id": ((_f = server_credentials[selected_server]) === null || _f === void 0 ? void 0 : _f.client_id) || "",
                                "client_secret": ((_g = server_credentials[selected_server]) === null || _g === void 0 ? void 0 : _g.client_secret) || ""
                            };
                            break;
                        case "G_DRIVE":
                            // Pass the entire credentials object, supporting both direct and web formats
                            args["__credentials__"] = ((_h = server_credentials[selected_server]) === null || _h === void 0 ? void 0 : _h.web) || server_credentials[selected_server] || {};
                            break;
                        case "SALESFORCE_MCP":
                            args.username = ((_j = server_credentials[selected_server]) === null || _j === void 0 ? void 0 : _j.username) || "";
                            args.password = ((_k = server_credentials[selected_server]) === null || _k === void 0 ? void 0 : _k.password) || "";
                            args.token = ((_l = server_credentials[selected_server]) === null || _l === void 0 ? void 0 : _l.token) || "";
                            // args.consumer_key = server_credentials[selected_server]?.consumer_key || "";
                            // args.consumer_secret = server_credentials[selected_server]?.consumer_secret || "";
                            break;
                        case "SLACK":
                            args["__credentials__"] = {
                                "slack_bot_token": ((_m = server_credentials[selected_server]) === null || _m === void 0 ? void 0 : _m.slack_bot_token) || "",
                                "slack_team_id": ((_o = server_credentials[selected_server]) === null || _o === void 0 ? void 0 : _o.slack_team_id) || "",
                                "slack_channel_ids": ((_p = server_credentials[selected_server]) === null || _p === void 0 ? void 0 : _p.slack_channel_ids) || ""
                            };
                            break;
                        case "JIRA":
                            args["__credentials__"] = {
                                "jira_email": ((_q = server_credentials[selected_server]) === null || _q === void 0 ? void 0 : _q.jira_email) || "",
                                "jira_api_token": ((_r = server_credentials[selected_server]) === null || _r === void 0 ? void 0 : _r.jira_api_token) || "",
                                "jira_domain": ((_s = server_credentials[selected_server]) === null || _s === void 0 ? void 0 : _s.jira_domain) || "",
                                "project_key": ((_t = server_credentials[selected_server]) === null || _t === void 0 ? void 0 : _t.project_key) || ""
                            };
                            break;
                        case "ZENDESK_MCP":
                            args["__credentials__"] = {
                                "email": ((_u = server_credentials[selected_server]) === null || _u === void 0 ? void 0 : _u.email) || "",
                                "token": ((_v = server_credentials[selected_server]) === null || _v === void 0 ? void 0 : _v.token) || "",
                                "subdomain": ((_w = server_credentials[selected_server]) === null || _w === void 0 ? void 0 : _w.subdomain) || ""
                            };
                            break;
                        case "HUBSPOT_MCP":
                            args["__credentials__"] = {
                                "access_token": ((_x = server_credentials[selected_server]) === null || _x === void 0 ? void 0 : _x.access_token) || ""
                            };
                            break;
                        case "X_MCP":
                            xCredentials = ((_y = server_credentials[selected_server]) === null || _y === void 0 ? void 0 : _y.credentials) || server_credentials[selected_server] || {};
                            args["__credentials__"] = {
                                "app_key": xCredentials.app_key || "",
                                "app_secret": xCredentials.app_secret || "",
                                "access_token": xCredentials.access_token || "",
                                "access_token_secret": xCredentials.access_token_secret || ""
                            };
                            break;
                        case "NOTION_MCP":
                            args["__credentials__"] = {
                                "notion_token": ((_z = server_credentials[selected_server]) === null || _z === void 0 ? void 0 : _z.notion_token) || "",
                            };
                            break;
                        case "CLICKUP_MCP":
                            args["__credentials__"] = {
                                "api_token": ((_0 = server_credentials[selected_server]) === null || _0 === void 0 ? void 0 : _0.api_token) || "",
                            };
                            break;
                        case "DROPBOX":
                            dropboxCreds = ((_1 = server_credentials[selected_server]) === null || _1 === void 0 ? void 0 : _1.credentials) || server_credentials[selected_server] || {};
                            args["__credentials__"] = {
                                "app_key": dropboxCreds.app_key || dropboxCreds.appKey || "",
                                "app_secret": dropboxCreds.app_secret || dropboxCreds.appSecret || "",
                                "refresh_token": dropboxCreds.refresh_token || dropboxCreds.refreshToken || "",
                            };
                            break;
                        case "FIGMA_MCP":
                            args["__credentials__"] = {
                                "api_token": ((_2 = server_credentials[selected_server]) === null || _2 === void 0 ? void 0 : _2.api_token) || "",
                                "figma_url": ((_3 = server_credentials[selected_server]) === null || _3 === void 0 ? void 0 : _3.figma_url) || "",
                                "depth": ((_4 = server_credentials[selected_server]) === null || _4 === void 0 ? void 0 : _4.depth) || 0,
                            };
                            break;
                        case "AIRTABLE":
                            airtableCreds = server_credentials[selected_server] || {};
                            args["__credentials__"] = {
                                "api_key": airtableCreds.api_key || "",
                            };
                            break;
                        case "SHOPIFY":
                            shopifyCreds = server_credentials[selected_server] || {};
                            args["__credentials__"] = {
                                "access_token": shopifyCreds.access_token || "",
                                "domain": shopifyCreds.domain || "",
                            };
                            break;
                        case "LINKEDIN":
                            args.accessToken = ((_5 = server_credentials[selected_server]) === null || _5 === void 0 ? void 0 : _5.access_token) || "";
                            break;
                        case "INSTAGRAM_MCP":
                            args["__credentials__"] = {
                                "accessToken": ((_6 = server_credentials[selected_server]) === null || _6 === void 0 ? void 0 : _6.accessToken) || "",
                                "businessAccountId": ((_7 = server_credentials[selected_server]) === null || _7 === void 0 ? void 0 : _7.businessAccountId) || "",
                                "appId": ((_8 = server_credentials[selected_server]) === null || _8 === void 0 ? void 0 : _8.appId) || "",
                                "appSecret": ((_9 = server_credentials[selected_server]) === null || _9 === void 0 ? void 0 : _9.appSecret) || "",
                            };
                            break;
                        case "PINTEREST":
                            args.accessToken = ((_10 = server_credentials[selected_server]) === null || _10 === void 0 ? void 0 : _10.accessToken) || ((_11 = server_credentials[selected_server]) === null || _11 === void 0 ? void 0 : _11.access_token) || "";
                            break;
                        case "WAYBACK":
                            // Wayback Machine doesn't require credentials for basic operations
                            // All tools work with public API endpoints
                            break;
                        default:
                            break;
                    }
                    _12.label = 1;
                case 1:
                    _12.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, server_connection_js_1.MCPServers[selected_server].callTool({
                            name: tool_name,
                            arguments: args
                        })];
                case 2:
                    tool_call_result = _12.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _12.sent();
                    tool_call_result = "".concat(err_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, tool_call_result];
            }
        });
    });
}
