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
exports.AzureOpenAIProcessor = AzureOpenAIProcessor;
var axios_1 = require("axios");
// Main OpenAI Processor function
function AzureOpenAIProcessor(data) {
    return __awaiter(this, void 0, void 0, function () {
        var params, selected_model, messages_arr, _i, _a, message, payload, response, is_tool_call, final_response_format, error_1, error_2;
        var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
        return __generator(this, function (_x) {
            switch (_x.label) {
                case 0:
                    _x.trys.push([0, 5, , 6]);
                    params = __assign({ input: '', images_arr: [], input_type: 'text', is_stream: false, prompt: '', api_key: '', chat_model: '', vision_model: '', speech_model: '', speech_to_text: '', chat_history: [], tools: [], temperature: 0.1, max_tokens: 1000, forced_tool_calls: null, tool_choice: 'auto' }, data);
                    selected_model = params.chat_model;
                    if (params.input_type === 'image') {
                        selected_model = params.vision_model;
                    }
                    if (params.input_type === 'audio') {
                        selected_model = params.speech_model;
                    }
                    // Validation
                    if (!params.api_key) {
                        return [2 /*return*/, {
                                Data: null,
                                Error: new Error("OpenAI API Key is Required"),
                                Status: false
                            }];
                    }
                    if (!params.max_tokens || params.max_tokens <= 0) {
                        return [2 /*return*/, {
                                Data: null,
                                Error: new Error("Max tokens must be greater than 0"),
                                Status: false
                            }];
                    }
                    if (params.api_key == "") {
                        return [2 /*return*/, {
                                Data: null,
                                Error: new Error("OpenAI API Key is required"),
                                Status: false
                            }];
                    }
                    messages_arr = [
                        {
                            role: "system",
                            content: params.prompt
                        }
                    ];
                    for (_i = 0, _a = params.chat_history; _i < _a.length; _i++) {
                        message = _a[_i];
                        messages_arr.push({
                            role: message.role,
                            content: message.content
                        });
                    }
                    payload = {
                        // model: selected_model || "",
                        messages: messages_arr,
                        max_tokens: params.max_tokens || 0,
                        stream: false,
                        tools: params.tools || [],
                        tool_choice: params.tool_choice || "auto",
                        temperature: params.temperature || 0.1,
                    };
                    _x.label = 1;
                case 1:
                    _x.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, axios_1.default)({
                            method: 'post',
                            url: "".concat(data === null || data === void 0 ? void 0 : data.endpoint, "/openai/deployments/").concat(data === null || data === void 0 ? void 0 : data.deployment_id, "/chat/completions?api-version=").concat(data === null || data === void 0 ? void 0 : data.api_version),
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': "Bearer ".concat(params.api_key)
                            },
                            data: payload,
                            timeout: 60000
                        })];
                case 2:
                    response = _x.sent();
                    is_tool_call = false;
                    if (((_e = (_d = (_c = (_b = response === null || response === void 0 ? void 0 : response.data) === null || _b === void 0 ? void 0 : _b.choices) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.message) === null || _e === void 0 ? void 0 : _e.tool_calls) && ((_k = (_j = (_h = (_g = (_f = response === null || response === void 0 ? void 0 : response.data) === null || _f === void 0 ? void 0 : _f.choices) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.message) === null || _j === void 0 ? void 0 : _j.tool_calls) === null || _k === void 0 ? void 0 : _k.length) > 0) {
                        is_tool_call = true;
                    }
                    final_response_format = {
                        total_llm_calls: 1,
                        total_tokens: ((_m = (_l = response === null || response === void 0 ? void 0 : response.data) === null || _l === void 0 ? void 0 : _l.usage) === null || _m === void 0 ? void 0 : _m.total_tokens) || 0,
                        total_input_tokens: ((_p = (_o = response === null || response === void 0 ? void 0 : response.data) === null || _o === void 0 ? void 0 : _o.usage) === null || _p === void 0 ? void 0 : _p.prompt_tokens) || 0,
                        total_output_tokens: ((_r = (_q = response === null || response === void 0 ? void 0 : response.data) === null || _q === void 0 ? void 0 : _q.usage) === null || _r === void 0 ? void 0 : _r.completion_tokens) || 0,
                        final_llm_response: response.data || {},
                        llm_responses_arr: [response.data],
                        messages: [((_v = (_u = (_t = (_s = response.data) === null || _s === void 0 ? void 0 : _s.choices) === null || _t === void 0 ? void 0 : _t[0]) === null || _u === void 0 ? void 0 : _u.message) === null || _v === void 0 ? void 0 : _v.content) || ""],
                        output_type: is_tool_call ? "tool_call" : "text"
                    };
                    return [2 /*return*/, {
                            Data: final_response_format,
                            Error: null,
                            Status: true
                        }];
                case 3:
                    error_1 = _x.sent();
                    return [2 /*return*/, {
                            Data: null,
                            Error: ((_w = error_1 === null || error_1 === void 0 ? void 0 : error_1.response) === null || _w === void 0 ? void 0 : _w.data) || (error_1 === null || error_1 === void 0 ? void 0 : error_1.request) || (error_1 === null || error_1 === void 0 ? void 0 : error_1.message),
                            Status: false
                        }];
                case 4: return [3 /*break*/, 6];
                case 5:
                    error_2 = _x.sent();
                    console.error('OpenAI Processing Error:', error_2);
                    return [2 /*return*/, {
                            Data: null,
                            Error: error_2 instanceof Error ? error_2 : new Error('An unexpected error occurred'),
                            Status: false
                        }];
                case 6: return [2 /*return*/];
            }
        });
    });
}
