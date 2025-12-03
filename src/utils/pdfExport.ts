import jsPDF from 'jspdf';

interface Employee {
  id: string;
  email: string;
  full_name: string;
  team: string;
  org_unit: string | null;
  created_at: string;
}

interface FeedbackEntry {
  id: string;
  title: string;
  date: string;
  status: string;
  summary: string;
  strengths: { title: string; description: string; impact: string }[];
  improvements: { title: string; description: string; action: string }[];
  competencies: { name: string; rating: number }[];
}

interface GrowthPath {
  shortTerm: string[];
  midTerm: string[];
  longTerm: string[];
  milestones: { quarter: string; goal: string; status: string }[];
  learningRecommendations: { topic: string; priority: string; timeframe: string; resource: string }[];
}

export const generatePDFReport = (
  employee: Employee,
  feedbackHistory: FeedbackEntry[],
  growthPath: GrowthPath,
  completedMilestones: string[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  const addText = (text: string, fontSize: number, isBold = false, color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * fontSize * 0.4 + 2;
  };

  const checkPageBreak = (height: number) => {
    if (y + height > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }
  };

  const drawLine = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  // Header
  doc.setFillColor(0, 45, 98);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Employee Feedback Report', margin, 25);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 35);
  
  y = 50;
  doc.setTextColor(0, 0, 0);

  // Employee Info Section
  addText('Employee Information', 16, true, [0, 45, 98]);
  drawLine();
  addText(`Name: ${employee.full_name}`, 11);
  addText(`Email: ${employee.email}`, 11);
  addText(`Team: ${employee.team}`, 11);
  addText(`Department: ${employee.org_unit || 'Not assigned'}`, 11);
  y += 5;

  // Performance Summary
  const avgRating = feedbackHistory.reduce((acc, f) => 
    acc + f.competencies.reduce((a, c) => a + c.rating, 0) / f.competencies.length, 0
  ) / feedbackHistory.length;

  addText('Performance Summary', 16, true, [0, 45, 98]);
  drawLine();
  addText(`Total Feedback Sessions: ${feedbackHistory.length}`, 11);
  addText(`Overall Average Rating: ${avgRating.toFixed(2)} / 5.0`, 11);
  y += 5;

  // Latest Feedback Competencies
  if (feedbackHistory.length > 0) {
    const latest = feedbackHistory[0];
    addText('Current Competency Ratings', 14, true);
    y += 2;
    latest.competencies.forEach(comp => {
      checkPageBreak(15);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${comp.name}:`, margin, y);
      
      // Progress bar
      const barWidth = 60;
      const barHeight = 4;
      const barX = 70;
      doc.setFillColor(230, 230, 230);
      doc.rect(barX, y - 3, barWidth, barHeight, 'F');
      doc.setFillColor(0, 45, 98);
      doc.rect(barX, y - 3, (comp.rating / 5) * barWidth, barHeight, 'F');
      doc.text(`${comp.rating}/5`, barX + barWidth + 5, y);
      y += 8;
    });
    y += 5;
  }

  // Feedback History
  checkPageBreak(30);
  addText('Feedback History', 16, true, [0, 45, 98]);
  drawLine();

  feedbackHistory.forEach((feedback, index) => {
    checkPageBreak(60);
    addText(`${index + 1}. ${feedback.title}`, 12, true);
    addText(`Date: ${new Date(feedback.date).toLocaleDateString()} | Status: ${feedback.status}`, 9, false, [100, 100, 100]);
    y += 2;
    addText(feedback.summary, 10);
    y += 3;

    // Strengths
    addText('Strengths:', 10, true, [34, 139, 34]);
    feedback.strengths.forEach(s => {
      checkPageBreak(15);
      addText(`• ${s.title}: ${s.description}`, 9);
    });
    y += 2;

    // Improvements
    addText('Areas for Improvement:', 10, true, [218, 165, 32]);
    feedback.improvements.forEach(imp => {
      checkPageBreak(15);
      addText(`• ${imp.title}: ${imp.description}`, 9);
    });
    y += 5;
  });

  // Growth Path
  doc.addPage();
  y = 20;
  addText('Personal Growth Path', 16, true, [0, 45, 98]);
  drawLine();

  addText('Short-term Goals', 12, true);
  growthPath.shortTerm.forEach(goal => {
    checkPageBreak(10);
    addText(`• ${goal}`, 10);
  });
  y += 3;

  addText('Mid-term Goals (3-6 months)', 12, true);
  growthPath.midTerm.forEach(goal => {
    checkPageBreak(10);
    addText(`• ${goal}`, 10);
  });
  y += 3;

  addText('Long-term Goals (12+ months)', 12, true);
  growthPath.longTerm.forEach(goal => {
    checkPageBreak(10);
    addText(`• ${goal}`, 10);
  });
  y += 5;

  // Milestones
  checkPageBreak(40);
  addText('Key Milestones', 14, true, [0, 45, 98]);
  drawLine();
  growthPath.milestones.forEach(m => {
    checkPageBreak(15);
    const isCompleted = completedMilestones.includes(m.goal);
    const statusText = isCompleted ? 'completed' : m.status;
    const statusColor: [number, number, number] = isCompleted ? [34, 139, 34] : m.status === 'in-progress' ? [59, 130, 246] : [100, 100, 100];
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${m.quarter}: ${m.goal}`, margin, y);
    doc.setTextColor(...statusColor);
    doc.text(`[${statusText}]`, pageWidth - margin - 30, y);
    doc.setTextColor(0, 0, 0);
    y += 8;
  });
  y += 5;

  // Learning Recommendations
  checkPageBreak(30);
  addText('Learning Recommendations', 14, true, [0, 45, 98]);
  drawLine();
  growthPath.learningRecommendations.forEach(rec => {
    checkPageBreak(20);
    addText(`${rec.topic} (${rec.priority} priority)`, 11, true);
    addText(`Resource: ${rec.resource} | Timeframe: ${rec.timeframe}`, 9, false, [100, 100, 100]);
    y += 3;
  });

  // Footer on last page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages} | EvalifyAI - Employee Feedback Report`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  doc.save(`${employee.full_name.replace(/\s+/g, '_')}_Feedback_Report.pdf`);
};
