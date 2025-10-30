import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * 지정된 DOM 요소를 PDF로 내보내기
 * @param {HTMLElement} element - PDF로 변환할 DOM 요소
 * @param {string} filename - 저장할 파일명 (기본: growth-report.pdf)
 */
export async function exportToPDF(element, filename = 'growth-report.pdf') {
  try {
    // HTML을 Canvas로 변환
    const canvas = await html2canvas(element, {
      scale: 2, // 고해상도
      useCORS: true,
      backgroundColor: '#f0fdf4',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // A4 크기에 맞게 이미지 조정
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // 여러 페이지로 나누기 (필요시)
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
}

