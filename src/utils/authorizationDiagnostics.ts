/**
 * Authorization Diagnostics Helper Utilities
 * 
 * Provides functions to help diagnose and fix authorization issues with company settings.
 * Generates SQL fix suggestions and helpful messages based on diagnostic results.
 */

export interface DiagnosticIssue {
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  sql?: string;
  steps?: string[];
}

export interface DiagnosticSummary {
  isAuthorized: boolean;
  issues: DiagnosticIssue[];
  recommendations: string[];
}

/**
 * Generate SQL fix for a specific authorization issue
 */
export function generateSQLFix(
  userEmail: string,
  userId: string,
  issueType: 'status' | 'role' | 'company_id' | 'company_mismatch',
  targetCompanyId?: string
): string | null {
  switch (issueType) {
    case 'status':
      return `UPDATE profiles SET status = 'active' WHERE email = '${userEmail}';`;
    
    case 'role':
      return `UPDATE profiles SET role = 'admin' WHERE email = '${userEmail}';`;
    
    case 'company_id':
      return `-- First, get a company ID from the companies table:
SELECT id FROM companies LIMIT 1;

-- Then assign the user to that company:
UPDATE profiles SET company_id = '[REPLACE_WITH_COMPANY_ID]' WHERE email = '${userEmail}';`;
    
    case 'company_mismatch':
      if (!targetCompanyId) return null;
      return `-- Update user's company to match the company they want to edit
UPDATE profiles SET company_id = '${targetCompanyId}' WHERE email = '${userEmail}';`;
    
    default:
      return null;
  }
}

/**
 * Analyze diagnostic data and generate a summary with actionable recommendations
 */
export function analyzeDiagnostics(diagnosticData: any): DiagnosticSummary {
  const issues: DiagnosticIssue[] = [];
  const recommendations: string[] = [];

  if (!diagnosticData) {
    return {
      isAuthorized: false,
      issues: [{
        severity: 'error',
        title: 'No Diagnostic Data',
        description: 'Unable to retrieve diagnostic information. Please refresh and try again.',
      }],
      recommendations: ['Refresh the page and try running diagnostics again'],
    };
  }

  const checks = diagnosticData.checks || {};
  const userProfile = diagnosticData.user_profile;

  // Check: User exists
  if (!checks.user_exists?.passed) {
    issues.push({
      severity: 'error',
      title: 'User Not Found',
      description: 'Your user profile is not found in the database. This is a critical issue.',
      steps: [
        'Contact your system administrator',
        'Verify your email address is correct',
        'Check that your user account was properly created in the database',
      ],
    });
    recommendations.push('Contact your system administrator to verify user setup');
  }

  // Check: User is active
  if (!checks.user_is_active?.passed) {
    issues.push({
      severity: 'error',
      title: 'Account Not Active',
      description: `Your user account is not active. Current status: "${userProfile?.status || 'unknown'}"`,
      sql: checks.user_is_active?.fix || undefined,
      steps: [
        'Your system administrator needs to activate your account',
        'Ask them to update your status to "active"',
        'Once activated, you\'ll be able to save company settings',
      ],
    });
    recommendations.push('Ask your administrator to activate your account');
  }

  // Check: User is admin
  if (!checks.user_is_admin?.passed) {
    issues.push({
      severity: 'error',
      title: 'Insufficient Role',
      description: `You need admin privileges. Current role: "${userProfile?.role || 'unknown'}"`,
      sql: checks.user_is_admin?.fix || undefined,
      steps: [
        'Your role must be set to "admin" or "super_admin"',
        'Contact your system administrator to update your role',
        'Once updated, you\'ll have permission to manage company settings',
      ],
    });
    recommendations.push('Ask your administrator to assign you the admin role');
  }

  // Check: User has company
  if (!checks.user_has_company?.passed) {
    issues.push({
      severity: 'error',
      title: 'No Company Assigned',
      description: 'Your user account is not assigned to any company.',
      sql: checks.user_has_company?.fix || undefined,
      steps: [
        'Your account must be assigned to a company',
        'Contact your administrator to assign you to the appropriate company',
        'They should update your company_id in the database',
      ],
    });
    recommendations.push('Ask your administrator to assign you to a company');
  }

  // Check: Company exists
  if (!checks.company_exists?.passed) {
    issues.push({
      severity: 'error',
      title: 'No Companies Available',
      description: 'There are no companies in the system to manage.',
      steps: [
        'Contact your system administrator',
        'Verify that at least one company has been created',
        'Ask them to create a company before you can manage settings',
      ],
    });
    recommendations.push('Have your administrator create a company first');
  }

  // Generate recommendations based on all checks
  const allChecksPassed = Object.values(checks).every((check: any) => check.passed);

  if (allChecksPassed) {
    recommendations.push('All authorization checks passed! You should be able to save company settings.');
  } else {
    recommendations.push('Address the issues above to regain access to company settings');
    
    if (issues.length === 1) {
      recommendations.push('Once this issue is fixed, try saving again');
    } else {
      recommendations.push(`You have ${issues.length} issues to address`);
    }
  }

  return {
    isAuthorized: allChecksPassed,
    issues,
    recommendations,
  };
}

/**
 * Get human-friendly explanation of why a 403 error occurred
 */
export function explainAuthorizationError(diagnosticData: any): string {
  const summary = analyzeDiagnostics(diagnosticData);

  if (summary.issues.length === 0) {
    return 'Authorization check passed. The 403 error may be from a different issue.';
  }

  if (summary.issues.length === 1) {
    const issue = summary.issues[0];
    return `Authorization blocked: ${issue.title}. ${issue.description}`;
  }

  const issueList = summary.issues
    .map((issue, idx) => `${idx + 1}. ${issue.title}: ${issue.description}`)
    .join('\n');

  return `Authorization blocked due to multiple issues:\n\n${issueList}`;
}

/**
 * Generate a comprehensive troubleshooting guide
 */
export function generateTroubleshootingGuide(diagnosticData: any): string {
  const summary = analyzeDiagnostics(diagnosticData);

  let guide = '# Authorization Troubleshooting Guide\n\n';
  guide += `Generated: ${new Date().toLocaleString()}\n\n`;

  guide += '## Your Authorization Status\n';
  guide += `**Status:** ${summary.isAuthorized ? '✅ AUTHORIZED' : '❌ NOT AUTHORIZED'}\n\n`;

  if (summary.issues.length > 0) {
    guide += '## Issues Found\n\n';
    summary.issues.forEach((issue, idx) => {
      guide += `### ${idx + 1}. ${issue.title} (${issue.severity.toUpperCase()})\n`;
      guide += `${issue.description}\n\n`;

      if (issue.sql) {
        guide += `**SQL Fix:**\n\`\`\`sql\n${issue.sql}\n\`\`\`\n\n`;
      }

      if (issue.steps && issue.steps.length > 0) {
        guide += `**Steps to Fix:**\n`;
        issue.steps.forEach((step) => {
          guide += `- ${step}\n`;
        });
        guide += '\n';
      }
    });
  } else {
    guide += '## ✅ No Issues Found\n';
    guide += 'All authorization checks passed. You should be able to save company settings.\n\n';
  }

  if (summary.recommendations.length > 0) {
    guide += '## Recommendations\n';
    summary.recommendations.forEach((rec) => {
      guide += `- ${rec}\n`;
    });
    guide += '\n';
  }

  guide += '## Next Steps\n';
  guide += '1. Review the issues above\n';
  guide += '2. Follow the SQL fixes if provided\n';
  guide += '3. Click "Refresh" to re-run diagnostics\n';
  guide += '4. Try saving company settings again\n\n';

  guide += 'If issues persist, contact your system administrator with this troubleshooting guide.\n';

  return guide;
}

/**
 * Get the most critical issue blocking authorization
 */
export function getMostCriticalIssue(diagnosticData: any): DiagnosticIssue | null {
  const summary = analyzeDiagnostics(diagnosticData);
  
  // Prioritize errors over warnings
  const errors = summary.issues.filter(issue => issue.severity === 'error');
  if (errors.length > 0) {
    return errors[0];
  }

  // Then warnings
  const warnings = summary.issues.filter(issue => issue.severity === 'warning');
  if (warnings.length > 0) {
    return warnings[0];
  }

  // Then info
  const infos = summary.issues.filter(issue => issue.severity === 'info');
  if (infos.length > 0) {
    return infos[0];
  }

  return null;
}

/**
 * Check if an issue can be auto-fixed with SQL
 */
export function isAutoFixable(issue: DiagnosticIssue): boolean {
  return !!issue.sql && issue.severity === 'error';
}

/**
 * Check if the user should contact admin vs. admin self-fixing
 */
export function shouldContactAdmin(diagnosticData: any): boolean {
  // If user is not admin in any sense, they need to contact admin
  const userProfile = diagnosticData.user_profile;
  if (!userProfile || !userProfile.role?.includes('admin')) {
    return true;
  }

  // If user's account status is the issue, they can't fix it themselves
  const checks = diagnosticData.checks || {};
  if (!checks.user_is_active?.passed) {
    return true; // An admin needs to activate this account
  }

  // If no companies exist, admin needs to create them
  if (!checks.company_exists?.passed) {
    return true; // No self-serve fix for this
  }

  // Otherwise, the user (if admin) can potentially fix it themselves
  return false;
}
