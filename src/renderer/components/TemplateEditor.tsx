import React, { useState, useEffect } from 'react';
import { Row, Col, Input, Button, Form, Typography, Card, Divider, Empty, Space, message } from 'antd';
import { SaveOutlined, CopyOutlined, EditOutlined, LinkOutlined } from '@ant-design/icons';
import { Template, Variable } from '../types';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface TemplateEditorProps {
  template: Template | null;
  onSaveTemplate: (template: Template) => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, onSaveTemplate }) => {
  const [form] = Form.useForm();
  const [variables, setVariables] = useState<Variable[]>([]);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [messageApi, contextHolder] = message.useMessage();
  const [isEditing, setIsEditing] = useState(false);

  // Reset form and variables when template changes
  useEffect(() => {
    if (template) {
      if (template.id === '') {
        setIsEditing(true);
      } else {
        setIsEditing(false);
      }
      form.setFieldsValue({
        title: template.title,
        content: template.content,
        link: template.link || '',
      });
      
      // Extract variables from template content
      const extractedVariables = extractVariables(template.content);
      setVariables(extractedVariables);
      
      // Initialize preview with original content
      updatePreview(template.content, extractedVariables);
    } else {
      form.resetFields();
      setVariables([]);
      setPreviewContent('');
    }
  }, [template, form]);

  // Extract variables from template content (format: {{variableName}})
  const extractVariables = (content: string): Variable[] => {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = content.matchAll(regex);
    const extractedVars: Variable[] = [];
    const uniqueNames = new Set<string>();
    
    for (const match of matches) {
      const name = match[1].trim();
      if (!uniqueNames.has(name)) {
        uniqueNames.add(name);
        extractedVars.push({ name, value: '' });
      }
    }
    
    return extractedVars;
  };

  // Update variables when template content changes
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    const extractedVariables = extractVariables(content);
    
    // Preserve existing variable values
    const updatedVariables = extractedVariables.map(newVar => {
      const existingVar = variables.find(v => v.name === newVar.name);
      return existingVar ? { ...existingVar } : newVar;
    });
    
    setVariables(updatedVariables);
    updatePreview(content, updatedVariables);
  };

  // Update variable value
  const handleVariableChange = (name: string, value: string) => {
    const updatedVariables = variables.map(v => 
      v.name === name ? { ...v, value } : v
    );
    setVariables(updatedVariables);
    
    const content = form.getFieldValue('content');
    updatePreview(content, updatedVariables);
  };

  // Update preview content with variable values
  const updatePreview = (content: string, vars: Variable[]) => {
    let updatedContent = content;
    
    for (const variable of vars) {
      const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
      updatedContent = updatedContent.replace(
        regex, 
        variable.value ? variable.value : `{{${variable.name}}}`
      );
    }
    
    setPreviewContent(updatedContent);
  };

  // Save template
  const handleSave = () => {
    form.validateFields().then(values => {
      if (template) {
        onSaveTemplate({
          id: template.id,
          title: values.title,
          content: values.content,
          link: values.link,
        });
        messageApi.success('Template saved successfully');
      }
    });
  };

  // Copy preview content to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(previewContent).then(() => {
      messageApi.success('Copied to clipboard');
    });
  };

  // Highlight variables in content
  const highlightVariables = (content: string) => {
    if (!content) return '';
    
    const regex = /\{\{([^}]+)\}\}/g;
    return content.replace(regex, '<span class="variable-highlight">{{$1}}</span>');
  };

  if (!template) {
    return (
      <Empty
        description="Select a template or create a new one"
        style={{ margin: '100px 0' }}
      />
    );
  }

  return (
    <>
      {contextHolder}
      <Form form={form} layout="vertical" initialValues={template} style={{ fontSize: '14px' }}>
        <div id="template-editor-layout" style={{ display: "flex", width: "100%", gap: "24px" }}>
          {/* Template Content Area (60%) */}
          <div id="template-content-area" style={{ flex: "0 0 60%", display: "flex", flexDirection: "column", gap: "16px", minWidth: "400px" }}>
            <Card 
              title={<div style={{ fontWeight: 'bold' }}>Prompt</div>}
              extra={
                <Space>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => setIsEditing(!isEditing)}
                    type={isEditing ? "primary" : "default"}
                  />

                  <Button 
                  icon={<SaveOutlined />} 
                  disabled={!isEditing}
                  onClick={handleSave}
                  />
                </Space>
              }
            >
              <Form.Item 
                name="title" 
                label={<span style={{ fontWeight: 'bold' }}>Title</span>}
                rules={[{ required: true, message: 'Please enter a template name' }]}
              >
                <Input 
                  disabled={!isEditing}
                  placeholder="Template Name" 
                />
              </Form.Item>
              
              <Form.Item 
                name="content"
                label={<span style={{ fontWeight: 'bold' }}>Prompt</span>}
                rules={[{ required: true, message: 'Please enter template content' }]}
              >
                <TextArea 
                  disabled={!isEditing}
                  placeholder="Enter your template content here. Use {{variableName}} for variables."
                  autoSize={{ minRows: 10, maxRows: 10 }}
                  onChange={handleContentChange}
                  className="allow-select"
                />
              </Form.Item>

              <Form.Item 
                name="link"
                label={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontWeight: 'bold' }}>Link</span>
                    {form.getFieldValue('link') && (
                      <a 
                        href={form.getFieldValue('link')} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ padding: 0 }}
                      >
                        <LinkOutlined />
                      </a>
                    )}
                  </div>
                }
              >
                <Input 
                  disabled={!isEditing}
                  placeholder="Enter link to the source (optional)" 
                />
              </Form.Item>
            </Card>
            
            <Card 
              title={<div style={{ fontWeight: 'bold' }}>Preview</div>}
              extra={
                <Button 
                  icon={<CopyOutlined />} 
                  onClick={handleCopy}
                  disabled={!previewContent}
                >
                </Button>
              }
            >
              <div 
                id="preview-content"
                className="allow-select"
                style={{ 
                  padding: '8px 12px',
                  border: '1px solid #303030',
                  borderRadius: '4px',
                  minHeight: '100px',
                  backgroundColor: '#141414',
                  whiteSpace: 'pre-wrap',
                }}
                dangerouslySetInnerHTML={{ __html: highlightVariables(previewContent) }}
              />
            </Card>
          </div>
          
          {/* Variables Area (auto width) */}
          <div id="variables-area" style={{ flex: "1", minWidth: "150px" }}>
            <Card title={<div style={{ fontWeight: 'bold' }}>Variables</div>}>
              {variables.length === 0 ? (
                <Empty 
                  description="No variables found" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Form layout="vertical">
                  {variables.map((variable, index) => (
                    <Form.Item 
                      key={index} 
                      label={<span style={{ fontWeight: 'bold' }}>{variable.name}</span>}
                    >
                      <Input.TextArea
                        placeholder={`Enter ${variable.name}`}
                        value={variable.value}
                        onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                        autoSize={{ minRows: 1, maxRows: 10 }}
                      />
                    </Form.Item>
                  ))}
                </Form>
              )}
            </Card>
          </div>
        </div>
      </Form>
    </>
  );
};

export default TemplateEditor; 