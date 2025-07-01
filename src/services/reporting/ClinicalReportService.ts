
// ABOUTME: Service for managing clinical reports and documentation
// ABOUTME: Handles CRUD operations for reports, SOAP notes, referral letters, and progress notes

import { supabase } from '@/integrations/supabase/client';
import { ClinicalReport, ReferralLetter, SOAPNote, ProgressNote, ReportTemplate } from '@/types/reporting';

export class ClinicalReportService {
  static async createClinicalReport(
    assessmentId: string,
    reportType: 'clinical_summary' | 'investigation_summary' | 'treatment_plan' | 'discharge_summary',
    title: string,
    content: any,
    format: 'pdf' | 'html' | 'docx' = 'pdf'
  ): Promise<ClinicalReport> {
    const { data, error } = await supabase
      .from('clinical_reports')
      .insert({
        assessment_id: assessmentId,
        report_type: reportType,
        title,
        content,
        format,
        generated_by: 'AI Assistant'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating clinical report:', error);
      throw new Error('Failed to create clinical report');
    }

    return {
      id: data.id,
      assessmentId: data.assessment_id,
      reportType: data.report_type,
      title: data.title,
      content: data.content,
      generatedAt: data.generated_at,
      generatedBy: data.generated_by,
      format: data.format,
      filePath: data.file_path,
      metadata: data.metadata
    };
  }

  static async createReferralLetter(
    assessmentId: string,
    specialty: string,
    clinicalQuestion: string,
    letterContent: any,
    urgency: 'routine' | 'urgent' | 'stat' = 'routine'
  ): Promise<ReferralLetter> {
    const { data, error } = await supabase
      .from('referral_letters')
      .insert({
        assessment_id: assessmentId,
        specialty,
        clinical_question: clinicalQuestion,
        letter_content: letterContent,
        urgency
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating referral letter:', error);
      throw new Error('Failed to create referral letter');
    }

    return {
      id: data.id,
      assessmentId: data.assessment_id,
      specialty: data.specialty,
      recipientName: data.recipient_name,
      recipientFacility: data.recipient_facility,
      urgency: data.urgency,
      clinicalQuestion: data.clinical_question,
      relevantHistory: data.relevant_history,
      examinationFindings: data.examination_findings,
      investigationsCompleted: data.investigations_completed,
      letterContent: data.letter_content,
      createdAt: data.created_at,
      sentAt: data.sent_at,
      status: data.status
    };
  }

  static async createSOAPNote(
    assessmentId: string,
    subjective: string,
    objective: string,
    assessment: string,
    plan: string,
    additionalNotes?: string,
    author?: string
  ): Promise<SOAPNote> {
    const { data, error } = await supabase
      .from('soap_notes')
      .insert({
        assessment_id: assessmentId,
        subjective,
        objective,
        assessment_text: assessment,
        plan_text: plan,
        additional_notes: additionalNotes,
        author
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating SOAP note:', error);
      throw new Error('Failed to create SOAP note');
    }

    return {
      id: data.id,
      assessmentId: data.assessment_id,
      subjective: data.subjective,
      objective: data.objective,
      assessment: data.assessment_text,
      plan: data.plan_text,
      additionalNotes: data.additional_notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      author: data.author,
      templateUsed: data.template_used
    };
  }

  static async createProgressNote(
    patientId: string,
    intervalHistory: string,
    assessmentId?: string,
    previousAssessmentId?: string,
    chiefComplaint?: string,
    examinationChanges?: string,
    investigationResults?: string,
    assessmentChanges?: string,
    planModifications?: string,
    followUpInstructions?: string
  ): Promise<ProgressNote> {
    const { data, error } = await supabase
      .from('progress_notes')
      .insert({
        patient_id: patientId,
        assessment_id: assessmentId,
        previous_assessment_id: previousAssessmentId,
        chief_complaint: chiefComplaint,
        interval_history: intervalHistory,
        examination_changes: examinationChanges,
        investigation_results: investigationResults,
        assessment_changes: assessmentChanges,
        plan_modifications: planModifications,
        follow_up_instructions: followUpInstructions
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating progress note:', error);
      throw new Error('Failed to create progress note');
    }

    return {
      id: data.id,
      patientId: data.patient_id,
      assessmentId: data.assessment_id,
      previousAssessmentId: data.previous_assessment_id,
      visitDate: data.visit_date,
      chiefComplaint: data.chief_complaint,
      intervalHistory: data.interval_history,
      examinationChanges: data.examination_changes,
      investigationResults: data.investigation_results,
      assessmentChanges: data.assessment_changes,
      planModifications: data.plan_modifications,
      followUpInstructions: data.follow_up_instructions,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  static async getAssessmentReports(assessmentId: string): Promise<ClinicalReport[]> {
    const { data, error } = await supabase
      .from('clinical_reports')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('generated_at', { ascending: false });

    if (error) {
      console.error('Error fetching assessment reports:', error);
      throw new Error('Failed to fetch assessment reports');
    }

    return data.map(report => ({
      id: report.id,
      assessmentId: report.assessment_id,
      reportType: report.report_type,
      title: report.title,
      content: report.content,
      generatedAt: report.generated_at,
      generatedBy: report.generated_by,
      format: report.format,
      filePath: report.file_path,
      metadata: report.metadata
    }));
  }

  static async getPatientProgressNotes(patientId: string): Promise<ProgressNote[]> {
    const { data, error } = await supabase
      .from('progress_notes')
      .select('*')
      .eq('patient_id', patientId)
      .order('visit_date', { ascending: false });

    if (error) {
      console.error('Error fetching progress notes:', error);
      throw new Error('Failed to fetch progress notes');
    }

    return data.map(note => ({
      id: note.id,
      patientId: note.patient_id,
      assessmentId: note.assessment_id,
      previousAssessmentId: note.previous_assessment_id,
      visitDate: note.visit_date,
      chiefComplaint: note.chief_complaint,
      intervalHistory: note.interval_history,
      examinationChanges: note.examination_changes,
      investigationResults: note.investigation_results,
      assessmentChanges: note.assessment_changes,
      planModifications: note.plan_modifications,
      followUpInstructions: note.follow_up_instructions,
      createdAt: note.created_at,
      updatedAt: note.updated_at
    }));
  }

  static async getReportTemplates(type?: string): Promise<ReportTemplate[]> {
    let query = supabase
      .from('report_templates')
      .select('*')
      .eq('active', true);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query.order('name');

    if (error) {
      console.error('Error fetching report templates:', error);
      throw new Error('Failed to fetch report templates');
    }

    return data.map(template => ({
      id: template.id,
      name: template.name,
      type: template.type,
      specialty: template.specialty,
      templateContent: template.template_content,
      defaultTemplate: template.default_template,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
      active: template.active
    }));
  }

  static async updateReferralLetterStatus(
    referralId: string,
    status: 'draft' | 'sent' | 'acknowledged',
    sentAt?: string
  ): Promise<void> {
    const updateData: any = { status };
    if (sentAt) {
      updateData.sent_at = sentAt;
    }

    const { error } = await supabase
      .from('referral_letters')
      .update(updateData)
      .eq('id', referralId);

    if (error) {
      console.error('Error updating referral letter status:', error);
      throw new Error('Failed to update referral letter status');
    }
  }
}
