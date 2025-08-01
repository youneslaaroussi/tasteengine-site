import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface ExportOptions {
  title: string
  content: string
  sessionId?: string
  chatTitle?: string
  chatMessages?: any[]
  timestamp?: Date
}

interface ToolData {
  toolName: string
  toolId: string
  data: any
  timestamp?: string
}

interface SessionAnalytics {
  totalMessages: number
  toolsUsed: { [key: string]: number }
  entitiesFound: string[]
  locationsFound: string[]
  brandsFound: string[]
  timelineEvents: Array<{ time: string, event: string, type: string }>
  topCategories: { [key: string]: number }
}

// Extract structured data from chat messages
function extractSessionData(messages: any[] = []): SessionAnalytics {
  const analytics: SessionAnalytics = {
    totalMessages: messages.length,
    toolsUsed: {},
    entitiesFound: [],
    locationsFound: [],
    brandsFound: [],
    timelineEvents: [],
    topCategories: {}
  }

  messages.forEach((message, index) => {
    if (message.role === 'assistant' && message.content) {
      // Extract tool usage
      const toolPattern = /{%\s*tool_complete\s+'([^']+)'\s+'([^']+)'\s*%}([\s\S]*?){%\s*endtool\s*%}/g
      let match
      
      while ((match = toolPattern.exec(message.content)) !== null) {
        const toolName = match[1]
        const toolData = match[3]
        
        analytics.toolsUsed[toolName] = (analytics.toolsUsed[toolName] || 0) + 1
        
        // Add timeline event
        analytics.timelineEvents.push({
          time: `Step ${index + 1}`,
          event: `${toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
          type: 'tool'
        })

        // Extract specific data based on tool type
        try {
          if (toolName === 'search_entities' && toolData.includes('"entities"')) {
            const entities = extractEntitiesFromToolData(toolData)
            analytics.entitiesFound.push(...entities)
          }
          
          if (toolName === 'search_shopify_products' && toolData.includes('"products"')) {
            const categories = extractCategoriesFromShopifyData(toolData)
            Object.keys(categories).forEach(category => {
              analytics.topCategories[category] = (analytics.topCategories[category] || 0) + categories[category]
            })
          }
        } catch (e) {
          console.log('TASTEENGINE_PDF_ANALYTICS Error parsing tool data:', e)
        }
      }
      
      // Extract entities, locations, brands from regular text
      const textEntities = extractEntitiesFromText(message.content)
      analytics.entitiesFound.push(...textEntities.entities)
      analytics.locationsFound.push(...textEntities.locations)
      analytics.brandsFound.push(...textEntities.brands)
    }
    
    if (message.role === 'user') {
      analytics.timelineEvents.push({
        time: `Step ${index + 1}`,
        event: 'User Query',
        type: 'user'
      })
    }
  })

  // Deduplicate arrays
  analytics.entitiesFound = [...new Set(analytics.entitiesFound)]
  analytics.locationsFound = [...new Set(analytics.locationsFound)]
  analytics.brandsFound = [...new Set(analytics.brandsFound)]

  return analytics
}

function extractEntitiesFromToolData(toolData: string): string[] {
  try {
    const jsonMatch = toolData.match(/"entities":\s*\[([\s\S]*?)\]/)
    if (jsonMatch) {
      const entitiesStr = jsonMatch[1]
      const entities = entitiesStr.match(/"name":\s*"([^"]+)"/g)
      return entities ? entities.map(e => e.match(/"([^"]+)"/)?.[1] || '').filter(Boolean) : []
    }
  } catch (e) {
    console.log('TASTEENGINE_PDF_ANALYTICS Error extracting entities:', e)
  }
  return []
}

function extractCategoriesFromShopifyData(toolData: string): { [key: string]: number } {
  const categories: { [key: string]: number } = {}
  try {
    const categoryMatches = toolData.match(/"product_type":\s*"([^"]+)"/g)
    if (categoryMatches) {
      categoryMatches.forEach(match => {
        const category = match.match(/"([^"]+)"/)?.[1]
        if (category) {
          categories[category] = (categories[category] || 0) + 1
        }
      })
    }
  } catch (e) {
    console.log('TASTEENGINE_PDF_ANALYTICS Error extracting categories:', e)
  }
  return categories
}

function extractEntitiesFromText(text: string): { entities: string[], locations: string[], brands: string[] } {
  const locations = ['USA', 'United States', 'UK', 'United Kingdom', 'Canada', 'France', 'Germany', 'Italy', 'Spain', 'Japan', 'China', 'India', 'Australia', 'New York', 'Los Angeles', 'Chicago', 'London', 'Paris', 'Tokyo', 'Sydney']
  const brands = ['Apple', 'Google', 'Microsoft', 'Amazon', 'Meta', 'Facebook', 'Tesla', 'Nike', 'Adidas', 'Samsung', 'Sony', 'Netflix', 'Spotify', 'Uber', 'Airbnb', 'Shopify', 'Stripe', 'PayPal']
  
  const foundLocations = locations.filter(loc => text.includes(loc))
  const foundBrands = brands.filter(brand => text.includes(brand))
  
  return {
    entities: [...foundBrands, ...foundLocations],
    locations: foundLocations,
    brands: foundBrands
  }
}

// Generate professional chart as base64 image
async function generateChart(type: 'doughnut' | 'bar' | 'line', data: any, options: any = {}): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = 480
    canvas.height = 320
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      resolve('')
      return
    }

    // Professional color palette
    const colors = ['#2563eb', '#64748b', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb']
    
    // Clean white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    if (type === 'doughnut' && data.datasets?.[0]?.data) {
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2 - 20
      const radius = 100
      const innerRadius = 60
      
      const total = data.datasets[0].data.reduce((a: number, b: number) => a + b, 0)
      let currentAngle = -Math.PI / 2 // Start from top
      
      // Draw chart
      data.datasets[0].data.forEach((value: number, index: number) => {
        const sliceAngle = (value / total) * 2 * Math.PI
        const color = colors[index % colors.length]
        
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true)
        ctx.closePath()
        ctx.fillStyle = color
        ctx.fill()
        
        // Add subtle stroke
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()
        
        currentAngle += sliceAngle
      })
      
      // Professional legend
      ctx.fillStyle = '#374151'
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.textAlign = 'left'
      
      const legendX = 20
      let legendY = 40
      
      data.labels.forEach((label: string, index: number) => {
        const color = colors[index % colors.length]
        const percentage = ((data.datasets[0].data[index] / total) * 100).toFixed(1)
        
        // Legend color box
        ctx.fillStyle = color
        ctx.fillRect(legendX, legendY - 8, 12, 12)
        
        // Legend text
        ctx.fillStyle = '#374151'
        ctx.fillText(`${label} (${percentage}%)`, legendX + 20, legendY + 2)
        
        legendY += 22
      })
    }
    
    if (type === 'bar' && data.datasets?.[0]?.data) {
      const maxValue = Math.max(...data.datasets[0].data)
      const barWidth = (canvas.width - 120) / data.labels.length
      const chartHeight = canvas.height - 120
      const chartTop = 40
      
      // Draw bars
      data.datasets[0].data.forEach((value: number, index: number) => {
        const barHeight = (value / maxValue) * chartHeight
        const x = 60 + index * barWidth
        const y = chartTop + chartHeight - barHeight
        
        ctx.fillStyle = colors[index % colors.length]
        ctx.fillRect(x + 5, y, barWidth - 10, barHeight)
        
        // Add value label on top of bar
        ctx.fillStyle = '#374151'
        ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(value.toString(), x + barWidth / 2, y - 8)
      })
      
      // Draw axes
      ctx.strokeStyle = '#d1d5db'
      ctx.lineWidth = 1
      
      // Y-axis
      ctx.beginPath()
      ctx.moveTo(55, chartTop)
      ctx.lineTo(55, chartTop + chartHeight)
      ctx.stroke()
      
      // X-axis
      ctx.beginPath()
      ctx.moveTo(55, chartTop + chartHeight)
      ctx.lineTo(canvas.width - 40, chartTop + chartHeight)
      ctx.stroke()
      
      // X-axis labels
      ctx.fillStyle = '#6b7280'
      ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.textAlign = 'center'
      
      data.labels.forEach((label: string, index: number) => {
        const x = 60 + index * barWidth + barWidth / 2
        const words = label.split(' ')
        
        if (words.length > 1) {
          ctx.fillText(words[0], x, chartTop + chartHeight + 18)
          ctx.fillText(words.slice(1).join(' '), x, chartTop + chartHeight + 32)
        } else {
          ctx.fillText(label, x, chartTop + chartHeight + 18)
        }
      })
    }
    
    resolve(canvas.toDataURL('image/png'))
  })
}

export async function exportNotesToPDF(options: ExportOptions): Promise<void> {
  const { title, content, sessionId, chatTitle, chatMessages = [], timestamp = new Date() } = options
  
  // Extract session analytics
  const analytics = extractSessionData(chatMessages)
  
  // Generate professional charts
  const toolUsageChart = Object.keys(analytics.toolsUsed).length > 0 ? await generateChart('doughnut', {
    labels: Object.keys(analytics.toolsUsed).map(tool => tool.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
    datasets: [{
      data: Object.values(analytics.toolsUsed)
    }]
  }) : null

  const categoriesChart = Object.keys(analytics.topCategories).length > 0 ? await generateChart('bar', {
    labels: Object.keys(analytics.topCategories).slice(0, 6),
    datasets: [{
      data: Object.values(analytics.topCategories).slice(0, 6)
    }]
  }) : null

  // Create a hidden container for rendering the content
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.style.width = '210mm'
  container.style.backgroundColor = 'white'
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  container.style.fontSize = '11px'
  container.style.lineHeight = '1.5'
  container.style.color = '#374151'
  
  // Professional business intelligence report HTML
  const pdfContent = `
    <div style="padding: 20mm; box-sizing: border-box; min-height: 277mm;">
      <!-- Professional Header -->
      <div style="border-bottom: 2px solid #2563eb; padding-bottom: 24px; margin-bottom: 32px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="flex: 1;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #1e293b; letter-spacing: -0.025em; line-height: 1.2;">
              TASTEENGINE
            </h1>
            <h2 style="margin: 4px 0 0 0; font-size: 18px; font-weight: 400; color: #64748b; letter-spacing: -0.015em;">
              Business Intelligence Report
            </h2>
            <p style="margin: 8px 0 0 0; color: #64748b; font-size: 12px; font-weight: 400;">
              Strategic Analysis & Session Intelligence
            </p>
          </div>
          <div style="text-align: right; color: #64748b; font-size: 10px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 4px; min-width: 180px;">
            <table style="width: 100%; font-size: 10px; line-height: 1.4;">
              <tr><td style="color: #64748b; padding: 2px 0;">Report Date:</td><td style="text-align: right; font-weight: 500;">${timestamp.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td></tr>
              <tr><td style="color: #64748b; padding: 2px 0;">Generated:</td><td style="text-align: right; font-weight: 500;">${timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td></tr>
              ${sessionId ? `<tr><td style="color: #64748b; padding: 2px 0;">Session ID:</td><td style="text-align: right; font-weight: 500; font-family: monospace;">${sessionId.slice(0, 8).toUpperCase()}</td></tr>` : ''}
              <tr><td style="color: #64748b; padding: 2px 0;">Page:</td><td style="text-align: right; font-weight: 500;">1 of 1</td></tr>
            </table>
          </div>
        </div>
      </div>

      <!-- Executive Summary -->
      <div style="margin-bottom: 32px;">
        <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #1e293b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
          Executive Summary
        </h3>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
          <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 20px; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: #2563eb; margin-bottom: 4px;">${analytics.totalMessages}</div>
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Total Interactions</div>
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 20px; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: #2563eb; margin-bottom: 4px;">${Object.keys(analytics.toolsUsed).length}</div>
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Tools Utilized</div>
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 20px; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: #2563eb; margin-bottom: 4px;">${analytics.entitiesFound.length}</div>
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Entities Identified</div>
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 20px; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: #2563eb; margin-bottom: 4px;">${analytics.timelineEvents.length}</div>
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Process Steps</div>
          </div>
        </div>
      </div>

      <!-- Analytics Section -->
      ${toolUsageChart || categoriesChart ? `
      <div style="margin-bottom: 32px;">
        <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #1e293b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
          Analytics Overview
        </h3>
        <div style="display: grid; grid-template-columns: ${toolUsageChart && categoriesChart ? '1fr 1fr' : '1fr'}; gap: 24px;">
          ${toolUsageChart ? `
          <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 24px;">
            <h4 style="margin: 0 0 16px 0; font-size: 12px; font-weight: 600; color: #374151;">Tool Utilization Distribution</h4>
            <img src="${toolUsageChart}" style="width: 100%; height: auto;" />
          </div>
          ` : ''}
          ${categoriesChart ? `
          <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 24px;">
            <h4 style="margin: 0 0 16px 0; font-size: 12px; font-weight: 600; color: #374151;">Category Analysis</h4>
            <img src="${categoriesChart}" style="width: 100%; height: auto;" />
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}

      <!-- Process Timeline -->
      ${analytics.timelineEvents.length > 0 ? `
      <div style="margin-bottom: 32px;">
        <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #1e293b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
          Process Timeline
        </h3>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <th style="text-align: left; padding: 8px 0; font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Step</th>
                <th style="text-align: left; padding: 8px 0; font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Action</th>
                <th style="text-align: left; padding: 8px 0; font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Type</th>
              </tr>
            </thead>
            <tbody>
              ${analytics.timelineEvents.slice(0, 12).map((event, index) => `
                <tr style="border-bottom: ${index === Math.min(analytics.timelineEvents.length - 1, 11) ? 'none' : '1px solid #f1f5f9'};">
                  <td style="padding: 12px 0; font-size: 11px; color: #64748b; width: 80px;">${event.time}</td>
                  <td style="padding: 12px 0; font-size: 11px; color: #374151; font-weight: 500;">${event.event}</td>
                  <td style="padding: 12px 0; font-size: 11px;">
                    <span style="padding: 2px 8px; border-radius: 12px; font-size: 9px; font-weight: 500; background: ${event.type === 'tool' ? '#dbeafe; color: #1e40af' : '#f1f5f9; color: #64748b'};">
                      ${event.type === 'tool' ? 'SYSTEM' : 'USER'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}

      <!-- Key Findings -->
      ${analytics.entitiesFound.length > 0 || analytics.brandsFound.length > 0 ? `
      <div style="margin-bottom: 32px;">
        <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #1e293b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
          Key Findings
        </h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;">
          ${analytics.brandsFound.length > 0 ? `
          <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 24px;">
            <h4 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: #374151;">Brand Analysis</h4>
            <div style="display: flex; flex-wrap: gap: 8px;">
              ${analytics.brandsFound.slice(0, 8).map(brand => `
                <span style="background: #f1f5f9; border: 1px solid #e2e8f0; color: #374151; font-size: 10px; padding: 4px 8px; border-radius: 4px; font-weight: 500;">${brand}</span>
              `).join('')}
            </div>
          </div>
          ` : ''}
          ${analytics.locationsFound.length > 0 ? `
          <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 24px;">
            <h4 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: #374151;">Geographic Scope</h4>
            <div style="display: flex; flex-wrap: gap: 8px;">
              ${analytics.locationsFound.slice(0, 8).map(location => `
                <span style="background: #f1f5f9; border: 1px solid #e2e8f0; color: #374151; font-size: 10px; padding: 4px 8px; border-radius: 4px; font-weight: 500;">${location}</span>
              `).join('')}
            </div>
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}

      <!-- Strategic Content -->
      <div style="margin-bottom: 32px;">
        <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #1e293b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
          Strategic Notes
        </h3>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 32px; line-height: 1.6; color: #374151;">
          ${content || '<p style="color: #9ca3af; font-style: italic;">No strategic content documented for this session.</p>'}
        </div>
      </div>

      <!-- Document Metadata -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 24px; margin-bottom: 32px;">
        <h4 style="margin: 0 0 16px 0; font-size: 12px; font-weight: 600; color: #374151;">Document Information</h4>
        <table style="width: 100%; font-size: 10px;">
          <tr>
            <td style="color: #64748b; padding: 4px 0; width: 120px;">Document Title:</td>
            <td style="font-weight: 500; color: #374151;">${title || 'Strategic Business Intelligence Report'}</td>
          </tr>
          ${chatTitle ? `
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Session Context:</td>
            <td style="font-weight: 500; color: #374151;">${chatTitle}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Analysis Period:</td>
            <td style="font-weight: 500; color: #374151;">${timestamp.toLocaleDateString('en-US', { 
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            })}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Analysis Scope:</td>
            <td style="font-weight: 500; color: #374151;">${analytics.totalMessages} interactions analyzed across ${Object.keys(analytics.toolsUsed).length} tool categories</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Classification:</td>
            <td style="font-weight: 500; color: #374151;">Internal Business Intelligence • Confidential</td>
          </tr>
        </table>
      </div>

      <!-- Professional Footer -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 9px; color: #64748b;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 600; color: #1e293b; margin-bottom: 2px;">TASTEENGINE BUSINESS INTELLIGENCE</div>
            <div>This document contains confidential and proprietary information</div>
          </div>
          <div style="text-align: right; font-family: monospace;">
            <div>Generated: ${timestamp.toISOString().split('T')[0]} ${timestamp.toTimeString().split(' ')[0]}</div>
            <div style="margin-top: 2px;">Report ID: ${sessionId ? sessionId.slice(0, 8).toUpperCase() : 'SYSTEM'}-${timestamp.getTime().toString().slice(-6)}</div>
          </div>
        </div>
      </div>
    </div>
  `
  
  container.innerHTML = pdfContent
  document.body.appendChild(container)
  
  try {
    // Render the content to canvas with high quality
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: container.offsetWidth,
      height: container.offsetHeight,
      windowWidth: container.offsetWidth,
      windowHeight: container.offsetHeight
    })
    
    // Create professional PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    })
    
    const imgWidth = 210 // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    // Add the image to PDF
    pdf.addImage(canvas.toDataURL('image/png', 0.9), 'PNG', 0, 0, imgWidth, imgHeight)
    
    // Generate professional filename
    const dateStr = timestamp.toISOString().split('T')[0]
    const sessionStr = sessionId ? `_${sessionId.slice(0, 8).toUpperCase()}` : ''
    const filename = `TasteEngine_Business_Intelligence_Report${sessionStr}_${dateStr}.pdf`
    
    // Download the PDF
    pdf.save(filename)
    
  } finally {
    // Clean up
    document.body.removeChild(container)
  }
}

export function cleanHtmlForPDF(html: string): string {
  return html
    .replace(/<p><\/p>/g, '<br>') 
    .replace(/<p>/g, '<div style="margin-bottom: 12px;">') 
    .replace(/<\/p>/g, '</div>')
    .replace(/<strong>/g, '<span style="font-weight: 600;">')
    .replace(/<\/strong>/g, '</span>')
    .replace(/<em>/g, '<span style="font-style: italic;">')
    .replace(/<\/em>/g, '</span>')
    .replace(/<blockquote>/g, '<div style="border-left: 3px solid #e2e8f0; padding-left: 20px; margin: 16px 0; font-style: italic; color: #64748b; background: #f8fafc; padding: 16px; border-radius: 4px;">')
    .replace(/<\/blockquote>/g, '</div>')
    .replace(/<ul>/g, '<ul style="margin: 12px 0; padding-left: 20px;">')
    .replace(/<ol>/g, '<ol style="margin: 12px 0; padding-left: 20px;">')
    .replace(/<li>/g, '<li style="margin-bottom: 6px;">')
} 