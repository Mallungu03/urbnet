import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { SendEmailOptions } from '@/shared/interfaces/send-email-options.interface';

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;
  private readonly templateCache = new Map<
    string,
    HandlebarsTemplateDelegate
  >();

  constructor(private readonly configService: ConfigService) {
    this.from = configService.get<string>(
      'smtp.from',
      'americomalungo03@gmail.com',
    );

    this.transporter = nodemailer.createTransport({
      host: configService.get<string>('smtp.host', 'smtp.gmail.com'),
      port: configService.get<number>('smtp.port', 587),
      secure: configService.get<boolean>('smtp.secure', false),
      auth: {
        user: configService.get<string>('smtp.user'),
        pass: configService.get<string>('smtp.pass'),
      },
    });
  }

  async send(options: SendEmailOptions): Promise<void> {
    let html = options.html;

    // Compila template Handlebars sempre que um nome de template for fornecido.
    if (options.template) {
      html = this.renderTemplate(options.template, options.templateData ?? {});
    }

    await this.transporter.sendMail({
      from: this.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: html ?? `<p>${options.text}</p>`,
    });
  }

  private renderTemplate(
    templateName: string,
    data: Record<string, unknown>,
  ): string {
    if (!this.templateCache.has(templateName)) {
      const templatePath = path.join(
        __dirname,
        '../templates',
        `${templateName}.hbs`,
      );

      if (fs.existsSync(templatePath)) {
        const source = fs.readFileSync(templatePath, 'utf8');
        this.templateCache.set(templateName, Handlebars.compile(source));
      } else {
        this.logger.warn(
          `Template "${templateName}" não encontrado em ${templatePath}. A usar fallback.`,
        );

        // Template genérico de fallback
        this.templateCache.set(
          templateName,
          Handlebars.compile(
            `<h1>{{title}}</h1><p>{{body}}</p><p>Equipa Reporta</p>`,
          ),
        );
      }
    }

    return this.templateCache.get(templateName)!(data);
  }
}
