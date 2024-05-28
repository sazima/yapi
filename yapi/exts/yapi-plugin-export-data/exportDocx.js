const fs = require('fs');
const JSON5 = require('json5'); // 引入 json5 包

const { Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell, TextRun, WidthType } = require('docx');

// 添加行到表格的函数
const addRow = (level, name, typ, required, description, table) => {
    const row = new TableRow({
        children: [
            new TableCell({ children: [new Paragraph(level)] }),
            new TableCell({ children: [new Paragraph(name)] }),
            new TableCell({ children: [new Paragraph(typ)] }),
            new TableCell({ children: [new Paragraph(required)] }),
            new TableCell({ children: [new Paragraph(description)] })
        ]
    });
    table.push(row);
};

// 解析属性并添加到表格的函数
const parseProperties = (level, properties, requiredFields, table) => {
    for (const [prop, details] of Object.entries(properties)) {
        const typ = Array.isArray(details.type) ? details.type.join('/') : details.type;
        const required = requiredFields.includes(prop) ? '是' : '否';
        addRow(level, prop, typ, required, details.description || '', table);

        if (details.properties) {
            const newLevel = `${level} -> ${prop}`;
            parseProperties(newLevel, details.properties, details.required || [], table);
        } else if (details.items && details.items.properties) {
            const newLevel = `${level} -> ${prop}[]`;
            parseProperties(newLevel, details.items.properties, details.items.required || [], table);
        }
    }
};

// 将 JSON 数据转换为 Word 文档的函数
async function jsonToWord  (jsonData)  {
    // 创建一个包含节的数组
    const sections = [
        // {
        //     properties: {},
        //     children: [
        //         new Paragraph({
        //             text: 'This is a paragraph in section 1.',
        //             heading: HeadingLevel.HEADING_1,
        //         })
        //     ]
        // },
        // {
        //     properties: {},
        //     children: [
        //         new Paragraph({
        //             text: 'This is a paragraph in section 2.',
        //             heading: HeadingLevel.HEADING_1,
        //         })
        //     ]
        // }
    ];
    const doc = new Document({
        creator: 'Your Name', // 创建者信息
        title: 'Document Title', // 文档标题
        description: 'Document Description', // 文档描述
        lastModifiedBy: 'Your Name', // 最后修改者
        sections: sections
    });
    const apiChildren = []
    jsonData.forEach(item => {
        // 添加一级标题
        apiChildren.push( new Paragraph({ text: item.name, heading: HeadingLevel.HEADING_1, }))

        // 添加描述
        if (item.desc) {
            apiChildren.push(new Paragraph(item.desc))
        }

        // 遍历 URL 列表
        item.list.forEach(api => {
            apiChildren.push(
                new Paragraph({ text: api.title, heading: HeadingLevel.HEADING_2 }),
                new Paragraph(`Method: ${api.method}`),
                new Paragraph(`URL: ${api.path}`)
            )

            if (api.desc) {
                apiChildren.push(new Paragraph(api.desc));
            }

            // 添加请求参数
            if (api.req_query.length > 0) {
                const reqTable = [
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph('名称')] }),
                            new TableCell({ children: [new Paragraph('必须')] }),
                            new TableCell({ children: [new Paragraph('示例')] }),
                            new TableCell({ children: [new Paragraph('描述')] })
                        ]
                    })
                ];

                api.req_query.forEach(param => {
                    reqTable.push(
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph(param.name)] }),
                                new TableCell({ children: [new Paragraph(param.required === '1' ? '是' : '否')] }),
                                new TableCell({ children: [new Paragraph(param.example || '')] }),
                                new TableCell({ children: [new Paragraph(param.desc)] })
                            ]
                        })
                    );
                });

                apiChildren.push(new Paragraph({ text: 'Request Parameters', heading: HeadingLevel.HEADING_3 }));
                apiChildren.push(new Table({   width: { size: 100, type: WidthType.PERCENTAGE }, rows: reqTable }));
            }
            // 发送body
            if (api.req_body_other) {
                apiChildren.push(new Paragraph({ text: 'Request Body', heading: HeadingLevel.HEADING_3 }));
                if (api.req_body_other.startsWith('{\"$schema\":\"http://json-schema.org')) {
                    const bodyJsonSchema = JSON.parse(api.req_body_other);
                    const resTable = [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph('层级')] }),
                                new TableCell({ children: [new Paragraph('属性名')] }),
                                new TableCell({ children: [new Paragraph('类型')] }),
                                new TableCell({ children: [new Paragraph('必需')] }),
                                new TableCell({ children: [new Paragraph('描述')] })
                            ]
                        })
                    ];
                    parseProperties('顶层', bodyJsonSchema.properties, bodyJsonSchema.required || [], resTable);
                    apiChildren.push(new Table({  width: { size: 100, type: WidthType.PERCENTAGE }, rows: resTable, alignment: 'center' })); // 设置表格居中
                } else {
                    const jsonParagraphs = api.req_body_other.split('\n').map(line => new Paragraph(line));
                    apiChildren.push(...jsonParagraphs);

                }
            }
            // 添加响应数据
            if (api.res_body) {
                apiChildren.push(new Paragraph({ text: 'Response', heading: HeadingLevel.HEADING_3 }));
                if (api.res_body.startsWith('{\"$schema\":\"http://json-schema.org')) {
                    const bodyJsonSchema = JSON.parse(api.res_body);
                    const resTable = [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph('层级')] }),
                                new TableCell({ children: [new Paragraph('属性名')] }),
                                new TableCell({ children: [new Paragraph('类型')] }),
                                new TableCell({ children: [new Paragraph('必需')] }),
                                new TableCell({ children: [new Paragraph('描述')] })
                            ]
                        })
                    ];

                    parseProperties('顶层', bodyJsonSchema.properties, bodyJsonSchema.required || [], resTable);
                    apiChildren.push(new Table({  width: { size: 100, type: WidthType.PERCENTAGE }, rows: resTable, alignment: 'center' })); // 设置表格居中
                } else {
                    // 将 JSON 格式化为漂亮的文本格式
                    // const formattedJson = JSON.stringify(JSON.parse(api.res_body), null, 2);
                    const formattedJson = JSON.stringify(JSON5.parse(api.res_body), null, 2)
                    const jsonParagraphs = formattedJson.split('\n').map(line => new Paragraph(line));
                    apiChildren.push(...jsonParagraphs);
                    // console.log(formattedJson);
                    // apiChildren.push(new Paragraph(formattedJson));
                }
            }

        });
    });
    apiChildren.push(new Paragraph(''));
    doc.addSection({ children: apiChildren });
    // 将文档打包为 Buffer 并返回
    return await Packer.toBuffer(doc);
};

// // 示例用法
// (async () => {
//     const jsonData = JSON.parse(fs.readFileSync('api.json', 'utf8'));
//     const buffer = await jsonToWord(jsonData);
//
//     // 将 Buffer 保存为 Word 文件
//     fs.writeFileSync('output.docx', buffer);
// })();
let r = {
    jsonToWord
};

module.exports = r;