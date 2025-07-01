
// ABOUTME: PDF generation service for clinical reports and documentation
// ABOUTME: Handles professional medical document formatting and export using jsPDF

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ClinicalReport, ReferralLetter, SOAPNote, PDFExportOptions } from '@/types/reporting';
import { Patient, DifferentialDiagnosis } from '@/types/medical';

export class PDFGeneratorService {
  private static defaultOptions: PDFExportOptions = {
    includeHeader: true,
    includeFooter: true,
    includePageNumbers: true,
    orientation: 'portrait',
    format: 'a4',
    margins: { top: 20, right: 15, bottom: 20, left: 15 }
  };

  static async generateClinicalReportPDF(
    report: ClinicalReport,
    patient: Patient,
    differentials: DifferentialDiagnosis[],
    options: Partial<PDFExportOptions> = {}
  ): Promise<Blob> {
    const config = { ...this.defaultOptions, ...options };
    const pdf = new jsPDF({
      orientation: config.orientation,
      unit: 'mm',
      format: config.format
    });

    // Set up fonts and styling
    pdf.setFont('helvetica');
    
    let yPosition = config.margins.top;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const contentWidth = pageWidth - config.margins.left - config.margins.right;

    // Header
    if (config.includeHeader) {
      yPosition = this.addHeader(pdf, config.margins.left, yPosition, contentWidth);
    }

    // Title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Clinical Assessment Report', config.margins.left, yPosition);
    yPosition += 10;

    // Patient Demographics
    yPosition = this.addPatientDemographics(pdf, patient, config.margins.left, yPosition, contentWidth);
    
    // Chief Complaint
    yPosition = this.addSection(pdf, 'Chief Complaint', report.content.chiefComplaint, config.margins.left, yPosition, contentWidth);
    
    // History of Present Illness
    if (report.content.historyPresentIllness.length > 0) {
      yPosition = this.addSection(pdf, 'History of Present Illness', report.content.historyPresentIllness.join(' '), config.margins.left, yPosition, contentWidth);
    }

    // Review of Systems
    if (Object.keys(report.content.reviewOfSystems).length > 0) {
      yPosition = this.addReviewOfSystems(pdf, report.content.reviewOfSystems, config.margins.left, yPosition, contentWidth);
    }

    // Differential Diagnoses
    if (differentials.length > 0) {
      yPosition = this.addDifferentialDiagnoses(pdf, differentials, config.margins.left, yPosition, contentWidth);
    }

    // Footer
    if (config.includeFooter) {
      this.addFooter(pdf, config);
    }

    return pdf.output('blob');
  }

  static async generateReferralLetterPDF(
    referral: ReferralLetter,
    patient: Patient,
    options: Partial<PDFExportOptions> = {}
  ): Promise<Blob> {
    const config = { ...this.defaultOptions, ...options };
    const pdf = new jsPDF({
      orientation: config.orientation,
      unit: 'mm',
      format: config.format
    });

    pdf.setFont('helvetica');
    let yPosition = config.margins.top;
    const contentWidth = pdf.internal.pageSize.getWidth() - config.margins.left - config.margins.right;

    // Letterhead
    yPosition = this.addLetterhead(pdf, config.margins.left, yPosition, contentWidth);

    // Date
    pdf.setFontSize(12);
    pdf.text(new Date().toLocaleDateString(), config.margins.left, yPosition);
    yPosition += 15;

    // Recipient
    if (referral.recipientName) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Dr. ${referral.recipientName}`, config.margins.left, yPosition);
      yPosition += 6;
    }
    if (referral.recipientFacility) {
      pdf.setFont('helvetica', 'normal');
      pdf.text(referral.recipientFacility, config.margins.left, yPosition);
      yPosition += 10;
    }

    // Subject line
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Re: ${patient.name} (${patient.patientId}) - ${referral.specialty} Referral`, config.margins.left, yPosition);
    yPosition += 10;

    // Salutation
    pdf.setFont('helvetica', 'normal');
    pdf.text('Dear Colleague,', config.margins.left, yPosition);
    yPosition += 10;

    // Clinical question
    yPosition = this.addSection(pdf, 'Clinical Question', referral.clinicalQuestion, config.margins.left, yPosition, contentWidth);

    // Patient demographics
    yPosition = this.addPatientDemographics(pdf, patient, config.margins.left, yPosition, contentWidth);

    // Relevant history
    if (referral.relevantHistory) {
      yPosition = this.addSection(pdf, 'Relevant History', referral.relevantHistory, config.margins.left, yPosition, contentWidth);
    }

    // Examination findings
    if (referral.examinationFindings) {
      yPosition = this.addSection(pdf, 'Examination Findings', referral.examinationFindings, config.margins.left, yPosition, contentWidth);
    }

    // Investigations completed
    if (referral.investigationsCompleted) {
      yPosition = this.addSection(pdf, 'Investigations Completed', referral.investigationsCompleted, config.margins.left, yPosition, contentWidth);
    }

    // Closing
    yPosition += 5;
    pdf.text('Thank you for your expertise in managing this patient.', config.margins.left, yPosition);
    yPosition += 10;
    pdf.text('Yours sincerely,', config.margins.left, yPosition);
    yPosition += 15;
    pdf.text('Dr. [Your Name]', config.margins.left, yPosition);

    if (config.includeFooter) {
      this.addFooter(pdf, config);
    }

    return pdf.output('blob');
  }

  static async generateSOAPNotePDF(
    soapNote: SOAPNote,
    patient: Patient,
    options: Partial<PDFExportOptions> = {}
  ): Promise<Blob> {
    const config = { ...this.defaultOptions, ...options };
    const pdf = new jsPDF({
      orientation: config.orientation,
      unit: 'mm',
      format: config.format
    });

    pdf.setFont('helvetica');
    let yPosition = config.margins.top;
    const contentWidth = pdf.internal.pageSize.getWidth() - config.margins.left - config.margins.right;

    if (config.includeHeader) {
      yPosition = this.addHeader(pdf, config.margins.left, yPosition, contentWidth);
    }

    // Title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SOAP Note', config.margins.left, yPosition);
    yPosition += 10;

    // Patient info
    yPosition = this.addPatientDemographics(pdf, patient, config.margins.left, yPosition, contentWidth);

    // SOAP sections
    yPosition = this.addSection(pdf, 'Subjective', soapNote.subjective, config.margins.left, yPosition, contentWidth);
    yPosition = this.addSection(pdf, 'Objective', soapNote.objective, config.margins.left, yPosition, contentWidth);
    yPosition = this.addSection(pdf, 'Assessment', soapNote.assessment, config.margins.left, yPosition, contentWidth);
    yPosition = this.addSection(pdf, 'Plan', soapNote.plan, config.margins.left, yPosition, contentWidth);

    if (soapNote.additionalNotes) {
      yPosition = this.addSection(pdf, 'Additional Notes', soapNote.additionalNotes, config.margins.left, yPosition, contentWidth);
    }

    if (config.includeFooter) {
      this.addFooter(pdf, config);
    }

    return pdf.output('blob');
  }

  private static addHeader(pdf: jsPDF, x: number, y: number, width: number): number {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Medical Practice', x, y);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Clinical Documentation System', x, y + 6);
    return y + 20;
  }

  private static addLetterhead(pdf: jsPDF, x: number, y: number, width: number): number {
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Medical Practice', x, y);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Address Line 1', x, y + 8);
    pdf.text('Address Line 2', x, y + 14);
    pdf.text('Phone: (000) 000-0000 | Email: practice@medical.com', x, y + 20);
    return y + 35;
  }

  private static addPatientDemographics(pdf: jsPDF, patient: Patient, x: number, y: number, width: number): number {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Patient Information:', x, y);
    y += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Name: ${patient.name}`, x, y);
    y += 6;
    pdf.text(`Patient ID: ${patient.patientId}`, x, y);
    y += 6;
    pdf.text(`Age: ${patient.age} years`, x, y);
    y += 6;
    pdf.text(`Gender: ${patient.gender}`, x, y);
    if (patient.location) {
      y += 6;
      pdf.text(`Location: ${patient.location}`, x, y);
    }
    return y + 10;
  }

  private static addSection(pdf: jsPDF, title: string, content: string, x: number, y: number, width: number): number {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${title}:`, x, y);
    y += 8;
    
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(content, width);
    pdf.text(lines, x, y);
    return y + (lines.length * 6) + 5;
  }

  private static addReviewOfSystems(pdf: jsPDF, rosData: Record<string, any>, x: number, y: number, width: number): number {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Review of Systems:', x, y);
    y += 8;
    
    pdf.setFont('helvetica', 'normal');
    Object.entries(rosData).forEach(([system, data]) => {
      if (data.positive && data.positive.length > 0) {
        pdf.text(`${system}: ${data.positive.join(', ')}`, x, y);
        y += 6;
      }
    });
    return y + 5;
  }

  private static addDifferentialDiagnoses(pdf: jsPDF, differentials: DifferentialDiagnosis[], x: number, y: number, width: number): number {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Differential Diagnoses:', x, y);
    y += 8;
    
    pdf.setFont('helvetica', 'normal');
    differentials.forEach((diff, index) => {
      pdf.text(`${index + 1}. ${diff.condition} (${diff.probability}%)`, x, y);
      y += 6;
      if (diff.explanation) {
        const lines = pdf.splitTextToSize(`   ${diff.explanation}`, width - 10);
        pdf.text(lines, x + 5, y);
        y += lines.length * 6;
      }
      y += 3;
    });
    return y + 5;
  }

  private static addFooter(pdf: jsPDF, config: PDFExportOptions): void {
    const pageHeight = pdf.internal.pageSize.getHeight();
    const y = pageHeight - config.margins.bottom;
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on ${new Date().toLocaleString()}`, config.margins.left, y);
    
    if (config.includePageNumbers) {
      const pageWidth = pdf.internal.pageSize.getWidth();
      pdf.text('Page 1', pageWidth - config.margins.right - 15, y);
    }
  }

  static async exportToPDF(htmlElement: HTMLElement, filename: string): Promise<void> {
    const canvas = await html2canvas(htmlElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  }
}
