"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.GeminiProcessor = GeminiProcessor;
var axios_1 = require("axios");
// Gemini API 
function GeminiProcessor(data) {
    return __awaiter(this, void 0, void 0, function () {
        var params, selected_model, chatContents, _i, _a, message, payload, response, messageContent, usage, is_tool_call, final_response_format, error_1, error_2;
        var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        return __generator(this, function (_r) {
            switch (_r.label) {
                case 0:
                    _r.trys.push([0, 5, , 6]);
                    params = __assign({ input: '', images_arr: [], input_type: 'text', is_stream: false, prompt: '', api_key: '', chat_model: 'gemini-2.0-pro', vision_model: 'gemini-pro-vision', speech_model: '', chat_history: [], tools: [], temperature: 0.1, max_tokens: 1000, forced_tool_calls: null, tool_choice: 'auto' }, data);
                    selected_model = params.chat_model;
                    if (params.input_type === 'image') {
                        selected_model = params.vision_model;
                    }
                    // Input validation
                    if (!params.api_key) {
                        return [2 /*return*/, {
                                Data: null,
                                Error: new Error("Gemini API Key is required"),
                                Status: false,
                            }];
                    }
                    if (!params.prompt && !params.input) {
                        return [2 /*return*/, {
                                Data: null,
                                Error: new Error("Prompt or input is required"),
                                Status: false,
                            }];
                    }
                    chatContents = [];
                    // Add chat history if available
                    for (_i = 0, _a = params.chat_history || []; _i < _a.length; _i++) {
                        message = _a[_i];
                        if (message.role === "user" || message.role === "model") {
                            chatContents.push({
                                role: message.role,
                                parts: [{ text: message.content }]
                            });
                        }
                    }
                    // Add latest user message
                    chatContents.push({
                        role: "user",
                        parts: [{ text: params.input }]
                    });
                    payload = {
                        system_instruction: {
                            parts: [
                                {
                                    text: params.prompt
                                }
                            ]
                        },
                        contents: chatContents,
                        generationConfig: {
                            temperature: params.temperature,
                            maxOutputTokens: params.max_tokens
                        }
                    };
                    if (params.tools && params.tools.length > 0) {
                        payload.tools = [
                            {
                                functionDeclarations: params.tools.map(function (tool) {
                                    var _a, _b, _c;
                                    return ({
                                        name: tool.function.name,
                                        description: tool.function.description,
                                        parameters: {
                                            type: ((_a = tool.function.parameters) === null || _a === void 0 ? void 0 : _a.type) || 'object',
                                            properties: Object.entries(((_b = tool.function.parameters) === null || _b === void 0 ? void 0 : _b.properties) || {}).reduce(function (acc, _a) {
                                                var _b;
                                                var _c;
                                                var key = _a[0], value = _a[1];
                                                return (__assign(__assign({}, acc), (_b = {}, _b[key] = value.type === "array" ? {
                                                    type: "array",
                                                    items: { type: ((_c = value.items) === null || _c === void 0 ? void 0 : _c.type) || "string" },
                                                    default: value.default || [],
                                                    description: value.description || ""
                                                } : {
                                                    type: value.type || "string",
                                                    default: value.default || "",
                                                    description: value.description || ""
                                                }, _b)));
                                            }, {}),
                                            required: ((_c = tool.function.parameters) === null || _c === void 0 ? void 0 : _c.required) || []
                                        }
                                    });
                                })
                            }
                        ];
                    }
                    _r.label = 1;
                case 1:
                    _r.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, axios_1.default)({
                            method: 'post',
                            url: "https://generativelanguage.googleapis.com/v1beta/models/".concat(selected_model, ":generateContent?key=").concat(params.api_key),
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            data: payload,
                            // timeout: 60000
                        })];
                case 2:
                    response = _r.sent();
                    messageContent = ((_g = (_f = (_e = (_d = (_c = (_b = response.data) === null || _b === void 0 ? void 0 : _b.candidates) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.content) === null || _e === void 0 ? void 0 : _e.parts) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.text) || '';
                    usage = ((_h = response.data) === null || _h === void 0 ? void 0 : _h.usageMetadata) || {};
                    is_tool_call = false;
                    if ((_p = (_o = (_m = (_l = (_k = (_j = response.data) === null || _j === void 0 ? void 0 : _j.candidates) === null || _k === void 0 ? void 0 : _k[0]) === null || _l === void 0 ? void 0 : _l.content) === null || _m === void 0 ? void 0 : _m.parts) === null || _o === void 0 ? void 0 : _o[0]) === null || _p === void 0 ? void 0 : _p.functionCall) {
                        is_tool_call = true;
                    }
                    final_response_format = {
                        total_llm_calls: 1,
                        total_tokens: usage.totalTokenCount || 0,
                        total_input_tokens: usage.promptTokenCount || 0,
                        total_output_tokens: usage.candidatesTokenCount || 0,
                        final_llm_response: response.data || {},
                        llm_responses_arr: [response.data],
                        messages: [messageContent],
                        output_type: is_tool_call ? "tool_call" : "text",
                    };
                    return [2 /*return*/, {
                            Data: final_response_format,
                            Error: null,
                            Status: true,
                        }];
                case 3:
                    error_1 = _r.sent();
                    return [2 /*return*/, {
                            Data: null,
                            Error: ((_q = error_1 === null || error_1 === void 0 ? void 0 : error_1.response) === null || _q === void 0 ? void 0 : _q.data) || (error_1 === null || error_1 === void 0 ? void 0 : error_1.request) || (error_1 === null || error_1 === void 0 ? void 0 : error_1.message),
                            Status: false,
                        }];
                case 4: return [3 /*break*/, 6];
                case 5:
                    error_2 = _r.sent();
                    console.error("Gemini Processing Error:", error_2);
                    return [2 /*return*/, {
                            Data: null,
                            Error: error_2 instanceof Error ? error_2 : new Error("Unexpected Error"),
                            Status: false
                        }];
                case 6: return [2 /*return*/];
            }
        });
    });
}
