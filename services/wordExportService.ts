
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, PageBreak } from "docx";
import { GeneratedQuestion, QuestionFormat } from "../types";

export const exportQuestionToWord = async (data: GeneratedQuestion) => {
  const children = [];

  // =========================================================================
  // PHẦN 1: ĐỀ BÀI (DÀNH CHO HỌC SINH)
  // =========================================================================

  // 1. Header / Title
  children.push(
    new Paragraph({
      text: "PHIẾU CÂU HỎI KIỂM TRA ĐÁNH GIÁ - GDPT 2018",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({ 
            text: `Dạng câu hỏi: ${data.metadata.format}`, 
            italics: true, 
            color: "666666" 
        })
      ]
    })
  );

  // 2. Question Stem
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Nội dung câu hỏi: ", bold: true, size: 28 }), // 14pt
        new TextRun({ text: data.stem, size: 28 }),
      ],
      spacing: { after: 200 },
    })
  );

  // 3. Options / Content based on format
  if (data.metadata.format === QuestionFormat.MULTIPLE_CHOICE && data.options) {
    const options = Object.entries(data.options).filter(([_, v]) => v);
    options.forEach(([key, value]) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${key}. `, bold: true }),
            new TextRun({ text: value }),
          ],
          spacing: { after: 100 },
          indent: { left: 720 }, // 0.5 inch
        })
      );
    });
  } else if (data.metadata.format === QuestionFormat.TRUE_FALSE && data.options) {
    // Create a table for True/False (Student View)
    const rows = [
      new TableRow({
        children: [
          new TableCell({ 
              children: [new Paragraph({ children: [new TextRun({ text: "Ý hỏi", bold: true })], alignment: AlignmentType.CENTER })], 
              width: { size: 10, type: WidthType.PERCENTAGE },
              verticalAlign: "center"
          }),
          new TableCell({ 
              children: [new Paragraph({ children: [new TextRun({ text: "Nội dung mệnh đề", bold: true })], alignment: AlignmentType.CENTER })], 
              width: { size: 60, type: WidthType.PERCENTAGE },
              verticalAlign: "center"
          }),
          new TableCell({ 
              children: [new Paragraph({ children: [new TextRun({ text: "Đúng / Sai", bold: true })], alignment: AlignmentType.CENTER })], 
              width: { size: 30, type: WidthType.PERCENTAGE },
              verticalAlign: "center"
          }),
        ],
      }),
    ];

    Object.entries(data.options).forEach(([key, value]) => {
      if (!value) return;
      rows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: key.toLowerCase() + ")", alignment: AlignmentType.CENTER })], verticalAlign: "center" }),
            new TableCell({ children: [new Paragraph(value)], verticalAlign: "center" }),
            new TableCell({ children: [new Paragraph("")] }), // Leave blank for student to fill
          ],
        })
      );
    });

    children.push(
      new Table({
        rows: rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        }
      }),
      new Paragraph({ text: "", spacing: { after: 200 } })
    );
  } else if (data.metadata.format === QuestionFormat.SHORT_ANSWER) {
    children.push(
        new Paragraph({
            children: [new TextRun({text: "Trả lời: ...........................................................................................................", italics: true})],
            spacing: { before: 200, after: 200 }
        })
    )
  }

  // =========================================================================
  // PHẦN 2: HƯỚNG DẪN CHẤM VÀ ĐÁP ÁN (DÀNH CHO GIÁO VIÊN)
  // =========================================================================
  
  // Ngắt trang để sang phần đáp án
  children.push(
    new Paragraph({
      children: [new PageBreak()],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      children: [
          new TextRun({ text: "HƯỚNG DẪN CHẤM & PHÂN TÍCH CHI TIẾT", color: "2E7D32", bold: true, size: 28 }) // 14pt Heading
      ],
      spacing: { after: 300 }
    })
  );

  // Metadata General
  children.push(
    new Paragraph({ children: [new TextRun({ text: "Chỉ báo năng lực (Chung): ", bold: true }), new TextRun(data.metadata.competencyCode)] }),
    new Paragraph({ children: [new TextRun({ text: "Cấp độ tư duy (Chung): ", bold: true }), new TextRun(data.metadata.level)] }),
    new Paragraph({ children: [new TextRun({ text: "Mô tả năng lực: ", bold: true }), new TextRun(data.metadata.competencyDescription)] }),
    new Paragraph({ children: [new TextRun({ text: "Bối cảnh thực tiễn: ", bold: true }), new TextRun(data.metadata.contextType)] }),
    new Paragraph({ text: "", spacing: { after: 200 } })
  );

  // LOGIC HIỂN THỊ ĐÁP ÁN THEO TỪNG DẠNG
  
  // A. NẾU LÀ DẠNG TRẮC NGHIỆM ĐÚNG SAI
  if (data.metadata.format === QuestionFormat.TRUE_FALSE) {
    
    // 1. Tạo chuỗi đáp án nhanh (Ví dụ: a) Đúng; b) Sai; c) Đúng; d) Sai)
    const quickKeyArray: string[] = [];
    ['a', 'b', 'c', 'd'].forEach(key => {
        // Handle case sensitivity for both analysis and options matching
        const sub = data.subQuestionAnalysis?.[key] || data.subQuestionAnalysis?.[key.toUpperCase()];
        if (sub) {
            quickKeyArray.push(`${key.toLowerCase()}) ${sub.isCorrect ? "Đúng" : "Sai"}`);
        }
    });
    
    children.push(
        new Paragraph({
            children: [
                new TextRun({ text: "ĐÁP ÁN NHANH: ", bold: true, color: "D32F2F" }),
                new TextRun({ text: quickKeyArray.join("   ;   "), bold: true })
            ],
            spacing: { after: 200 }
        })
    );

    if (data.subQuestionAnalysis) {
        children.push(new Paragraph({ children: [new TextRun({ text: "Bảng phân tích chi tiết từng lệnh hỏi:", bold: true })], spacing: { after: 100 } }));
        
        // 2. Tạo bảng chi tiết
        const analysisRows = [
            new TableRow({
                tableHeader: true,
                children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Ý", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 5, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nội dung", bold: true })] })], width: { size: 35, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Kết luận", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Cấp độ", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Mã chỉ báo", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Giải thích chi tiết", bold: true })] })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                ]
            })
        ];

        ['a', 'b', 'c', 'd'].forEach(key => {
            const sub = data.subQuestionAnalysis?.[key] || data.subQuestionAnalysis?.[key.toUpperCase()];
            const content = data.options?.[key] || data.options?.[key.toUpperCase()] || "";
            
            if (sub) {
                let resultText = "—";
                if (sub.isCorrect === true) resultText = "Đúng";
                else if (sub.isCorrect === false) resultText = "Sai";

                analysisRows.push(new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: key.toLowerCase() + ")", alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph(content)] }),
                        new TableCell({ children: [new Paragraph({ 
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: resultText,
                                    bold: true,
                                    color: resultText === "Đúng" ? "2E7D32" : "D32F2F"
                                })
                            ]
                        })] }),
                        new TableCell({ children: [new Paragraph({ text: sub.level, alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: sub.competencyCode, alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: sub.rationale })] }),
                    ]
                }));
            }
        });

        children.push(
            new Table({
                rows: analysisRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                }
            }),
            new Paragraph({ text: "", spacing: { after: 200 } })
        );
    }

  } 
  
  // B. NẾU LÀ DẠNG TRẮC NGHIỆM NHIỀU LỰA CHỌN
  else if (data.metadata.format === QuestionFormat.MULTIPLE_CHOICE) {
      // Tìm nội dung của đáp án đúng để hiển thị kèm
      let fullAnswerText = data.correctAnswer;
      if (data.options) {
          const key = data.correctAnswer.trim(); 
          // normalize key to compare
          const optionEntry = Object.entries(data.options).find(([k, v]) => k.toLowerCase() === key.toLowerCase());
          if (optionEntry) {
              fullAnswerText = `${optionEntry[0]}. ${optionEntry[1]}`;
          }
      }

      children.push(
        new Paragraph({
            children: [
              new TextRun({ text: "ĐÁP ÁN ĐÚNG: ", bold: true }),
              new TextRun({ text: fullAnswerText, color: "D32F2F", bold: true })
            ],
            spacing: { after: 100 }
          })
      );

      // Thêm căn cứ đánh giá
      children.push(
        new Paragraph({ children: [new TextRun({ text: "Căn cứ đánh giá:", bold: true })], spacing: { before: 100 } }),
        new Paragraph({ text: `- Cấp độ tư duy: ${data.metadata.rationaleLevel}`, bullet: { level: 0 } }),
        new Paragraph({ text: `- Chỉ báo năng lực: ${data.metadata.rationaleCompetency}`, bullet: { level: 0 } }),
        new Paragraph({ text: "", spacing: { after: 200 } })
      );
  }

  // C. DẠNG KHÁC (TRẢ LỜI NGẮN)
  else {
      children.push(
        new Paragraph({
            children: [
              new TextRun({ text: "ĐÁP ÁN: ", bold: true }),
              new TextRun({ text: data.correctAnswer, color: "D32F2F", bold: true })
            ],
            spacing: { after: 100 }
          }),
        new Paragraph({ children: [new TextRun({ text: "Căn cứ đánh giá:", bold: true })], spacing: { before: 100 } }),
        new Paragraph({ text: `- Cấp độ tư duy: ${data.metadata.rationaleLevel}`, bullet: { level: 0 } }),
        new Paragraph({ text: `- Chỉ báo năng lực: ${data.metadata.rationaleCompetency}`, bullet: { level: 0 } }),
        new Paragraph({ text: "", spacing: { after: 200 } })
      );
  }

  // Phần giải thích chung (Luôn hiển thị cuối cùng)
  children.push(
    new Paragraph({
        children: [
          new TextRun({ text: "Hướng dẫn giải chi tiết:", bold: true, underline: {} }),
        ],
        spacing: { before: 100, after: 100 }
    }),
    new Paragraph({
      text: data.explanation,
      spacing: { after: 200 }
    })
  );

  // Create Document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  // Generate and Download
  // Sử dụng tên file tiếng Việt không dấu, dễ đọc
  const fileName = `Phieu_cau_hoi_${data.metadata.competencyCode}_${Date.now()}.docx`;
  
  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
