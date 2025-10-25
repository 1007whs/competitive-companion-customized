import { Sendable } from '../../models/Sendable';
import { TaskBuilder } from '../../models/TaskBuilder';
import { htmlToElement } from '../../utils/dom';
import { Parser } from '../Parser';

export class NKSProblemParser extends Parser {
    public getMatchPatterns(): string[] {
        return ['http://oi.nks.edu.cn/zh/Problem/Details*'];
    }

    public async parse(url: string, html: string): Promise<Sendable> {
        const elem = htmlToElement(html);
        const task = new TaskBuilder('NKS OJ').setUrl(url);

        // 提取基本信息
        const params = new URLSearchParams(url.split('?')[1]);
        const cid = params.get('cid');
        const tid = params.get('tid');
        const shortName = `NKS ${cid} ${tid}`;

        const titleElem = elem.querySelector('#TdMainTitle');
        const fullTitle = titleElem.textContent.trim().replace(/^[a-zA-Z]\s+/, '');
        await task.setName(fullTitle, shortName);

        task.setTimeLimit(1000);
        task.setMemoryLimit(1024);

        // 核心逻辑：保留空格、换行，并移除中文解释
        this.parseSamplesWithChineseCleanup(elem, task);

        return task.build();
    }

    /**
     * 处理样例：保留空格和换行，移除中文解释（从第一个中文字符到末尾）
     */
    private parseSamplesWithChineseCleanup(elem: Element, task: TaskBuilder): void {
        // 处理样例输入
        const inputElements = Array.from(elem.querySelectorAll('[id^="SampleInput-"]'))
            .map(el => {
                const pTag = el.querySelector('p');
                if (!pTag) return { number: -1, content: '' };

                // 1. 基础处理：移除<p>标签，转换空格实体
                let content = pTag.innerHTML
                    .replace(/<\/?p>/gi, '') // 移除<p>标签
                    .replace(/&nbsp;|&#160;/gi, ' ') // 转换空格实体
                    .trim(); // 去除首尾空白

                // 2. 核心：移除中文解释（从第一个中文字符到末尾）
                content = this.removeChineseExplanation(content);

                return {
                    number: parseInt(el.id.split('-')[1], 10),
                    content
                };
            })
            .filter(item => item.number !== -1)
            .sort((a, b) => a.number - b.number);

        // 处理样例输出（同输入逻辑）
        const outputElements = Array.from(elem.querySelectorAll('[id^="SampleOutput-"]'))
            .map(el => {
                const pTag = el.querySelector('p');
                if (!pTag) return { number: -1, content: '' };

                let content = pTag.innerHTML
                    .replace(/<\/?p>/gi, '')
                    .replace(/&nbsp;|&#160;/gi, ' ')
                    .trim();

                content = this.removeChineseExplanation(content);

                return {
                    number: parseInt(el.id.split('-')[1], 10),
                    content
                };
            })
            .filter(item => item.number !== -1)
            .sort((a, b) => a.number - b.number);

        // 配对样例
        const maxCount = Math.min(inputElements.length, outputElements.length);
        for (let i = 0; i < maxCount; i++) {
            task.addTest(inputElements[i].content, outputElements[i].content);
        }
    }

    /**
     * 移除从第一个中文字符到末尾的内容，保留末尾换行
     * 中文范围：\u4e00-\u9fa5（基本汉字）
     */
    private removeChineseExplanation(content: string): string {
        // 匹配第一个中文字符的位置
        const chineseMatch = content.match(/[\u4e00-\u9fa5]/);
        if (!chineseMatch) {
            // 无中文，直接返回
            return content;
        }

        // 截取到第一个中文字符之前的内容
        const cutoffIndex = chineseMatch.index;
        let cleaned = content.substring(0, cutoffIndex);

        // 保留末尾的换行（如果原始内容在中文前有换行）
        // 例如："abc\n123 中文解释" → 截取后为"abc\n123"（保留换行）
        return cleaned;
    }
}